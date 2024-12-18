import { ResourceManager, Texture } from "./resources";
import shaderSource from "./shader.wgsl?raw";
import { Color, Vec2 } from "./utils";
import { Matrix3x3, multiply, projection } from "./utils/mat3";

export type MeshData = {
  id: string;
  vertexData: Float32Array;
  indexData: Uint16Array;
};

type MeshBuffers = {
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  numIndices: number;
};

type InstanceData = {
  modelMatrix: Matrix3x3;
  color: Color;
};

type TextureEntry = {
  textureView: GPUTextureView;
  sampler: GPUSampler;
  bindGroup: GPUBindGroup;
};

export class Renderer {
  private context!: GPUCanvasContext;
  private device!: GPUDevice;
  private canTimestamp = false;
  private pipeline!: GPURenderPipeline;
  private querySet!: GPUQuerySet;
  private resolveBuffer!: GPUBuffer;
  private resultBuffer!: GPUBuffer;
  private projectionMatrix!: Matrix3x3;
  private meshCache = new Map<string, MeshBuffers>();
  private textureCache = new Map<string, TextureEntry>();
  private instancesByTextureData = new Map<string, Map<string, InstanceData[]>>();
  private defaultTextureEntry!: TextureEntry;
  gpuTime: number = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private viewportSize: Vec2,
    private resourceManager: ResourceManager
  ) {}

  async init() {
    const adapter = await navigator.gpu?.requestAdapter();
    this.canTimestamp = Boolean(adapter?.features.has("timestamp-query"));
    const device = await adapter?.requestDevice({
      requiredFeatures: [...((this.canTimestamp ? ["timestamp-query"] : []) as GPUFeatureName[])],
    });
    if (!device) {
      throw new Error("need a browser with WebGPU support. See https://caniuse.com/webgpu");
    }

    this.device = device;

    this.updateCanvasSize();
    this.updateProjectionMatrix();

    this.device.onuncapturederror = (event) => {
      console.error("Uncaptured WebGPU error:", event.error);
    };

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    this.context = this.canvas.getContext("webgpu")!;
    this.context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: "premultiplied",
    });

    const shaderModule = this.device.createShaderModule({
      code: shaderSource,
    });

    // Check for shader compilation errors
    const compilationInfo = await shaderModule.getCompilationInfo();
    if (compilationInfo.messages.length > 0) {
      for (const msg of compilationInfo.messages) {
        if (msg.type === "error") {
          console.error("Shader compilation error:", msg.message);
        } else {
          console.warn("Shader compilation warning:", msg.message);
        }
      }
      // If there are errors, throw an exception to prevent pipeline creation
      throw new Error("Shader compilation failed");
    }

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vs",
        buffers: [
          {
            arrayStride: 4 * 4, // Vertex buffer for geometry: position + uv = 4 floats * 4 bytes = 16 bytes/vertex
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x2", // position
              },
              {
                shaderLocation: 1,
                offset: 8,
                format: "float32x2", // uv
              },
            ],
          },
          {
            arrayStride: 64, // 4 floats (vec4 color) + 9 floats (3x3 matrix)
            stepMode: "instance",
            attributes: [
              { shaderLocation: 2, offset: 0, format: "float32x4" }, // Color (vec4f)
              { shaderLocation: 3, offset: 16, format: "float32x4" }, // Matrix row 0
              { shaderLocation: 4, offset: 32, format: "float32x4" }, // Matrix row 1
              { shaderLocation: 5, offset: 48, format: "float32x4" }, // Matrix row 2
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs",
        targets: [
          {
            format: presentationFormat,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
            writeMask: GPUColorWrite.ALL,
          },
        ],
      },
    });

    await this.loadTextures();

    if (this.canTimestamp) {
      this.querySet = device.createQuerySet({
        type: "timestamp",
        count: 2,
      });
      this.resolveBuffer = device.createBuffer({
        size: this.querySet.count * 8,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      });
      this.resultBuffer = device.createBuffer({
        size: this.resolveBuffer.size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const _ of entries) {
        this.updateCanvasSize();
        this.updateProjectionMatrix();
      }
    });
    try {
      resizeObserver.observe(this.canvas.parentElement!, { box: "content-box" });
    } catch {
      resizeObserver.observe(this.canvas.parentElement!, { box: "device-pixel-content-box" });
    }
  }

  private updateCanvasSize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const parentWidth = parent.clientWidth * dpr;
    const parentHeight = parent.clientHeight * dpr;

    const aspect = this.viewportSize.x / this.viewportSize.y;
    let canvasWidth: number;
    let canvasHeight: number;

    if (parentWidth / parentHeight > aspect) {
      // Parent is wider than viewport aspect ratio
      canvasHeight = parentHeight;
      canvasWidth = canvasHeight * aspect;
    } else {
      // Parent is taller than viewport aspect ratio
      canvasWidth = parentWidth;
      canvasHeight = canvasWidth / aspect;
    }

    this.canvas.width = Math.min(canvasWidth, this.device.limits.maxTextureDimension2D);
    this.canvas.height = Math.min(canvasHeight, this.device.limits.maxTextureDimension2D);

    this.canvas.style.width = `${canvasWidth / dpr}px`;
    this.canvas.style.height = `${canvasHeight / dpr}px`;

    // Center the canvas
    this.canvas.style.position = "absolute";
    this.canvas.style.left = `${(parent.clientWidth - canvasWidth / dpr) / 2}px`;
    this.canvas.style.top = `${(parent.clientHeight - canvasHeight / dpr) / 2}px`;
  }

  private updateProjectionMatrix() {
    this.projectionMatrix = projection(this.viewportSize.x, this.viewportSize.y);
  }

  beginFrame() {
    this.instancesByTextureData.clear();
  }

  queueDraw(meshData: MeshData, modelMatrix: Matrix3x3, color: Color, textureId?: string) {
    if (!this.meshCache.has(meshData.id)) this.createGeometryBuffers(meshData.id, meshData);

    const texId = textureId ?? "default_texture";

    if (!this.instancesByTextureData.has(texId)) {
      this.instancesByTextureData.set(texId, new Map());
    }

    const meshMap = this.instancesByTextureData.get(texId)!;
    if (!meshMap.has(meshData.id)) {
      meshMap.set(meshData.id, []);
    }
    meshMap.get(meshData.id)!.push({ modelMatrix, color });
  }

  private createGeometryBuffers(meshId: string, meshData: MeshData) {
    const vertexBuffer = this.device.createBuffer({
      size: meshData.vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(vertexBuffer, 0, meshData.vertexData);

    const indexBuffer = this.device.createBuffer({
      size: meshData.indexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(indexBuffer, 0, meshData.indexData);

    this.meshCache.set(meshId, {
      vertexBuffer,
      indexBuffer,
      numIndices: meshData.indexData.length,
    });
  }

  endFrame() {
    const textureView = this.context.getCurrentTexture().createView();
    const commandEncoder = this.device.createCommandEncoder();

    const renderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      ...(this.canTimestamp && {
        timestampWrites: {
          querySet: this.querySet,
          beginningOfPassWriteIndex: 0,
          endOfPassWriteIndex: 1,
        },
      }),
    });

    renderPassEncoder.setPipeline(this.pipeline);

    for (const [textureId, meshMap] of this.instancesByTextureData) {
      const textureEntry =
        textureId === "default_texture" ? this.defaultTextureEntry : this.textureCache.get(textureId)!;

      if (!textureEntry) {
        console.warn(`Texture with id ${textureId} is not loaded`);
        continue;
      }

      renderPassEncoder.setBindGroup(0, textureEntry.bindGroup);

      for (const [meshId, instances] of meshMap) {
        const { vertexBuffer, indexBuffer, numIndices } = this.meshCache.get(meshId)!;

        const instanceBuffer = this.device.createBuffer({
          size: instances.length * 64, // 12 floats for matrix + 4 for color = 16 floats * 4 bytes
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        const instanceData = new Float32Array(
          instances.flatMap(({ modelMatrix, color }) => {
            const combinedMatrix = multiply(this.projectionMatrix, modelMatrix);
            return [
              ...color.toFloat32Array(),
              ...[...combinedMatrix.slice(0, 3), 0, ...combinedMatrix.slice(3, 6), 0, ...combinedMatrix.slice(6, 9), 0],
            ];
          })
        );

        this.device.queue.writeBuffer(instanceBuffer, 0, instanceData);

        renderPassEncoder.setVertexBuffer(0, vertexBuffer);
        renderPassEncoder.setVertexBuffer(1, instanceBuffer);
        renderPassEncoder.setIndexBuffer(indexBuffer, "uint16");
        renderPassEncoder.drawIndexed(numIndices, instances.length, 0, 0, 0);
      }
    }

    renderPassEncoder.end();

    if (this.canTimestamp) {
      commandEncoder.resolveQuerySet(this.querySet, 0, this.querySet.count, this.resolveBuffer, 0);
      if (this.resultBuffer.mapState === "unmapped") {
        commandEncoder.copyBufferToBuffer(this.resolveBuffer, 0, this.resultBuffer, 0, this.resultBuffer.size);
      }
    }

    const commandBuffer = commandEncoder.finish();
    this.device.queue.submit([commandBuffer]);

    if (this.canTimestamp && this.resultBuffer.mapState === "unmapped") {
      this.resultBuffer.mapAsync(GPUMapMode.READ).then(() => {
        const times = new BigInt64Array(this.resultBuffer.getMappedRange());
        this.gpuTime += (Number(times[1] - times[0]) - this.gpuTime) / 100;
        this.resultBuffer.unmap();
      });
    }
  }

  private async loadTextures() {
    for (const { id, imageBitmap } of this.resourceManager.getAll("Texture") as Texture[]) {
      this.loadTexture(id, imageBitmap);
    }

    await this.createDefaultTexture();
  }

  loadTexture(id: string, imageBitmap: ImageBitmap) {
    const textureEntry = this.createTexture(imageBitmap);
    this.textureCache.set(id, textureEntry);
  }

  private createTexture(imageBitmap: ImageBitmap): TextureEntry {
    const sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });

    const texture = this.device.createTexture({
      size: [imageBitmap.width, imageBitmap.height],
      format: "rgba8unorm",
      usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.device.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture }, [
      imageBitmap.width,
      imageBitmap.height,
    ]);

    const textureView = texture.createView();

    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: sampler,
        },
        {
          binding: 1,
          resource: textureView,
        },
      ],
    });

    return { textureView, sampler, bindGroup };
  }

  private async createDefaultTexture() {
    const whitePixelData = new Uint8ClampedArray([255, 255, 255, 255]);
    const imageData = new ImageData(whitePixelData, 1, 1);
    const imageBitmap = await createImageBitmap(imageData);
    this.defaultTextureEntry = this.createTexture(imageBitmap);
  }
}

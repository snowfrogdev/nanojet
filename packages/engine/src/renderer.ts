import shaderSource from "./shader.wgsl?raw";
import { Color } from "./utils";
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
  private instanceData = new Map<string, InstanceData[]>();
  gpuTime: number = 0;

  constructor(private canvas: HTMLCanvasElement) {}

  async initWebGPU() {
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

    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vs",
        buffers: [
          {
            arrayStride: 2 * 4, // two float32 per vertex position (vec2f)
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x2",
              },
            ],
          },
          {
            arrayStride: 64, // 4 floats (vec4 color) + 9 floats (3x3 matrix)
            stepMode: "instance",
            attributes: [
              { shaderLocation: 1, offset: 0, format: "float32x4" }, // Color (vec4f)
              { shaderLocation: 2, offset: 16, format: "float32x4" }, // Matrix row 0
              { shaderLocation: 3, offset: 32, format: "float32x4" }, // Matrix row 1
              { shaderLocation: 4, offset: 48, format: "float32x4" }, // Matrix row 2
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
      for (const entry of entries) {
        const dpr = Math.min(devicePixelRatio, 2);
        const width = entry.devicePixelContentBoxSize?.[0].inlineSize || entry.contentBoxSize[0].inlineSize * dpr;
        const height = entry.devicePixelContentBoxSize?.[0].blockSize || entry.contentBoxSize[0].blockSize * dpr;
        const canvas = entry.target as HTMLCanvasElement;
        canvas.width = Math.max(1, Math.min(width, this.device.limits.maxTextureDimension2D));
        canvas.height = Math.max(1, Math.min(height, this.device.limits.maxTextureDimension2D));
        this.updateProjectionMatrix();
      }
    });
    try {
      resizeObserver.observe(this.canvas, { box: "device-pixel-content-box" });
    } catch {
      resizeObserver.observe(this.canvas, { box: "content-box" });
    }
  }

  private updateCanvasSize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width * dpr;
    const height = rect.height * dpr;
    this.canvas.width = Math.max(1, Math.min(width, this.device.limits.maxTextureDimension2D));
    this.canvas.height = Math.max(1, Math.min(height, this.device.limits.maxTextureDimension2D));
  }

  private updateProjectionMatrix() {
    this.projectionMatrix = projection(this.canvas.width, this.canvas.height);
  }

  beginFrame() {
    this.instanceData.clear();
  }

  queueDraw(meshData: MeshData, modelMatrix: Matrix3x3, color: Color) {
    if (!this.instanceData.has(meshData.id)) {
      this.instanceData.set(meshData.id, []);
    }
    this.instanceData.get(meshData.id)!.push({ modelMatrix, color });

    // Cache geometry buffers if not already cached
    if (!this.meshCache.has(meshData.id)) this.createGeometryBuffers(meshData.id, meshData);
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

    for (const [meshId, instances] of this.instanceData) {
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

      renderPassEncoder.setPipeline(this.pipeline);
      renderPassEncoder.setVertexBuffer(0, vertexBuffer);
      renderPassEncoder.setVertexBuffer(1, instanceBuffer);
      renderPassEncoder.setIndexBuffer(indexBuffer, "uint16");
      renderPassEncoder.drawIndexed(numIndices, instances.length, 0, 0, 0);
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
}

import shaderSource from "./shader.wgsl?raw";
import { Color } from "./utils";
import { Matrix3x3, multiply, projection } from "./utils/mat3";

type GeometryBuffers = {
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  numIndices: number;
};

export class Renderer {
  private context!: GPUCanvasContext;
  private device!: GPUDevice;
  private pipeline!: GPURenderPipeline;
  private uniformBindGroupLayout!: GPUBindGroupLayout;
  private renderPassEncoder!: GPURenderPassEncoder;
  private commandEncoder!: GPUCommandEncoder;
  private projectionMatrix!: Matrix3x3;
  private kModelMatrixOffset = 4; // Offset in floats after color (vec4f)
  private uniformBufferSize = 4 * 4 + 3 * 16; // Total size in bytes (vec4f + mat3x3f)

  private geometryCache = new Map<string, GeometryBuffers>();

  constructor(private canvas: HTMLCanvasElement) {
    this.updateProjectionMatrix();
  }

  private updateProjectionMatrix() {
    this.projectionMatrix = projection(this.canvas.width, this.canvas.height);
  }

  async initWebGPU() {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter?.requestDevice();

    if (!device) {
      throw new Error("need a browser that supports WebGPU");
    }

    this.device = device;
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

    // Create uniform bind group layout
    this.uniformBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
      ],
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
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.uniformBindGroupLayout],
      }),
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
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs",
        targets: [
          {
            format: presentationFormat,
          },
        ],
      },
    });

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

  beginFrame() {
    const textureView = this.context.getCurrentTexture().createView();

    this.commandEncoder = this.device.createCommandEncoder();

    this.renderPassEncoder = this.commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
  }

  endFrame() {
    this.renderPassEncoder.end();
    const commandBuffer = this.commandEncoder.finish();
    this.device.queue.submit([commandBuffer]);
  }

  draw(geometryId: string, vertexData: Float32Array, indexData: Uint16Array, modelMatrix: Matrix3x3, color: Color) {
    const combinedMatrix = multiply(this.projectionMatrix, modelMatrix);

    const uniformValues = new Float32Array(16 /* Number of floats */);
    uniformValues.set(color.toFloat32Array(), 0);

    // copy the combined matrix into the uniform buffer, adding padding to make it 4x4
    uniformValues.set(
      [...combinedMatrix.slice(0, 3), 0, ...combinedMatrix.slice(3, 6), 0, ...combinedMatrix.slice(6, 9), 0],
      this.kModelMatrixOffset
    );

    const uniformBuffer = this.device.createBuffer({
      size: this.uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(uniformBuffer, 0, uniformValues.buffer);

    const uniformBindGroup = this.device.createBindGroup({
      layout: this.uniformBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer,
          },
        },
      ],
    });

    const { vertexBuffer, indexBuffer, numIndices } = this.getGeometryBuffers(geometryId, vertexData, indexData);

    this.renderPassEncoder.setPipeline(this.pipeline);
    this.renderPassEncoder.setVertexBuffer(0, vertexBuffer);
    this.renderPassEncoder.setIndexBuffer(indexBuffer, "uint16");
    this.renderPassEncoder.setBindGroup(0, uniformBindGroup);

    this.renderPassEncoder.drawIndexed(numIndices, 1, 0, 0, 0);
  }

  private getGeometryBuffers(geometryId: string, vertexData: Float32Array, indexData: Uint16Array): GeometryBuffers {
    if (this.geometryCache.has(geometryId)) {
      return this.geometryCache.get(geometryId)!;
    }

    const vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    const indexBuffer = this.device.createBuffer({
      size: indexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(indexBuffer, 0, indexData);

    const geometryBuffers: GeometryBuffers = {
      vertexBuffer,
      indexBuffer,
      numIndices: indexData.length,
    };

    this.geometryCache.set(geometryId, geometryBuffers);

    return geometryBuffers;
  }
}

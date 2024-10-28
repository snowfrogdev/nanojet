import shaderSource from "./basic.wgsl?raw";
import { Color } from "./utils";
import { Matrix3x3, multiply, projection } from "./utils/mat3";

export class Renderer {
  private context!: GPUCanvasContext;
  private device!: GPUDevice;
  private pipeline!: GPURenderPipeline;
  private uniformBuffer!: GPUBuffer;
  private uniformBindGroup!: GPUBindGroup;
  private vertexBuffer!: GPUBuffer;
  private indexBuffer!: GPUBuffer;
  private renderPassEncoder!: GPURenderPassEncoder;
  private commandEncoder!: GPUCommandEncoder;
  private projectionMatrix!: Matrix3x3;
  private uniformValues!: Float32Array;
  private kColorOffset = 0; // Offset in floats
  private kModelMatrixOffset = 4; // Offset in floats after color (vec4f)
  private uniformBufferSize = 4 * 4 + 3 * 16; // Total size in bytes (vec4f + mat3x3f)

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

    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vs",
        buffers: [
          {
            arrayStride: 2 * 4, // two float32 per vertex
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

    this.uniformBuffer = this.device.createBuffer({
      size: this.uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.uniformValues = new Float32Array(this.uniformBufferSize / 4); // Number of floats

    this.uniformBindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.uniformBuffer,
          },
        },
      ],
    });

    const vertexData = new Float32Array([
      0,
      0, // bottom-left
      1,
      0, // bottom-right
      1,
      1, // top-right
      0,
      1, // top-left
    ]);

    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);

    const indexData = new Uint16Array([
      0,
      1,
      2, // first triangle
      2,
      3,
      0, // second triangle
    ]);

    this.indexBuffer = this.device.createBuffer({
      size: indexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);

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

    this.renderPassEncoder.setPipeline(this.pipeline);
    this.renderPassEncoder.setVertexBuffer(0, this.vertexBuffer);
    this.renderPassEncoder.setIndexBuffer(this.indexBuffer, "uint16");
  }

  endFrame() {
    this.renderPassEncoder.end();
    const commandBuffer = this.commandEncoder.finish();
    this.device.queue.submit([commandBuffer]);
  }

  drawRectangle(modelMatrix: Matrix3x3, color: Color) {
    const combinedMatrix = multiply(this.projectionMatrix, modelMatrix);

    this.uniformValues.set(color.toFloat32Array(), this.kColorOffset);

    // copy the combined matrix into the uniform buffer, adding padding to make it 4x4
    this.uniformValues.set(
      [...combinedMatrix.slice(0, 3), 0, ...combinedMatrix.slice(3, 6), 0, ...combinedMatrix.slice(6, 9), 0],
      this.kModelMatrixOffset
    );

    this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues.buffer);

    this.renderPassEncoder.setBindGroup(0, this.uniformBindGroup);

    this.renderPassEncoder.drawIndexed(6, 1, 0, 0, 0);
  }
}

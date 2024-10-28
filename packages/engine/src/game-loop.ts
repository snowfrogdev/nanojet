import { SECOND_IN_MILLISECONDS } from "./constants";
import { World } from "./ecs";
import { Renderer } from "./renderer";

export class GameLoop {
  private previousTimeInMs = 0;
  private updatePreviousTimeInMs = 0;
  private frameId = 0;
  private lagInMs = 0;
  private updateStepInMs = SECOND_IN_MILLISECONDS / 60;
  private renderFrameTimeInMs = 0;
  private updateFrameTimeInMs = 0;
  private fpsFilterStrength = 20;
  private renderer: Renderer;

  constructor(private world: World, updateFramesPerSeconds: number, canvas: HTMLCanvasElement) {
    this.updateStepInMs = SECOND_IN_MILLISECONDS / updateFramesPerSeconds;
    this.renderer = new Renderer(canvas);
  }

  async init() {
    await this.renderer.initWebGPU();
  }

  start() {
    this.previousTimeInMs = performance.now();
    this.frameId = requestAnimationFrame(this.loop);
  }

  stop() {
    cancelAnimationFrame(this.frameId);
  }

  getRenderFps(): number {
    return SECOND_IN_MILLISECONDS / this.renderFrameTimeInMs;
  }

  getUpdateFps(): number {
    return SECOND_IN_MILLISECONDS / this.updateFrameTimeInMs;
  }

  private loop = () => {
    const currentTimeInMs = performance.now();
    const deltaTimeInMs = currentTimeInMs - this.previousTimeInMs;
    this.previousTimeInMs = currentTimeInMs;
    this.lagInMs += Math.min(SECOND_IN_MILLISECONDS, deltaTimeInMs);

    this.processInput();

    while (this.lagInMs >= this.updateStepInMs) {
      const updateCurrentTimeInMs = performance.now();
      const updateDeltaTimeInMs = updateCurrentTimeInMs - this.updatePreviousTimeInMs;
      this.updateFrameTimeInMs += (updateDeltaTimeInMs - this.updateFrameTimeInMs) / this.fpsFilterStrength;
      this.updatePreviousTimeInMs = updateCurrentTimeInMs;

      this.update(updateDeltaTimeInMs);
      this.lagInMs -= this.updateStepInMs;
    }

    this.render(this.lagInMs / this.updateStepInMs);
    this.renderFrameTimeInMs += (deltaTimeInMs - this.renderFrameTimeInMs) / this.fpsFilterStrength;

    this.frameId = requestAnimationFrame(this.loop);
  };

  private processInput() {
    this.world.processInput();
  }

  private update(deltaTimeInMs: number) {
    this.world.update(deltaTimeInMs);
  }

  private render(extrapolation: number) {
    this.renderer.beginFrame();
    this.world.render(extrapolation, this.renderer);
    this.renderer.endFrame();
  }
}

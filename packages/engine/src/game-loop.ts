import { SECOND_IN_MILLISECONDS } from "./constants";

export class GameLoop {
  private previousTimeInMs = 0;
  private updatePreviousTimeInMs = 0;
  private frameId = 0;
  private lagInMs = 0;
  private updateStepInMs = SECOND_IN_MILLISECONDS / 60;
  private renderFrameTimeInMs = 0;
  private updateFrameTimeInMs = 0;
  private fpsFilterStrength = 20;

  constructor(
    updateFramesPerSeconds: number,
    private readonly processInput: () => void,
    private readonly update: (deltaTimeInMs: number) => void,
    private readonly render: (extrapolation: number) => void
  ) {
    this.updateStepInMs = SECOND_IN_MILLISECONDS / updateFramesPerSeconds;
  }

  start() {
    this.previousTimeInMs = performance.now();
    this.frameId = requestAnimationFrame(this.loop);
  }

  stop() {
    cancelAnimationFrame(this.frameId);
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

      this.update(this.updateStepInMs);
      this.lagInMs -= this.updateStepInMs;
    }

    this.render(this.lagInMs / this.updateStepInMs);
    this.renderFrameTimeInMs += (deltaTimeInMs - this.renderFrameTimeInMs) / this.fpsFilterStrength;

    this.frameId = requestAnimationFrame(this.loop);
  };

  getRenderFps(): number {
    return SECOND_IN_MILLISECONDS / this.renderFrameTimeInMs;
  }

  getUpdateFps(): number {
    return SECOND_IN_MILLISECONDS / this.updateFrameTimeInMs;
  }
}

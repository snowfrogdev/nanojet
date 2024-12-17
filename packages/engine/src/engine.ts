import { World } from "./ecs";
import { GameLoop } from "./game-loop";
import { Renderer } from "./renderer";
import { Resource, ResourceLoader, ResourceManager, ResourceType } from "./resources";
import { Vec2 } from "./utils";

export class Engine {
  private renderer: Renderer;
  private _world: World;
  get world(): World {
    return this._world;
  }
  private loop: GameLoop;
  private resourceManager = new ResourceManager();

  constructor(canvas: HTMLCanvasElement, viewportSize: Vec2) {
    this.renderer = new Renderer(canvas, viewportSize, this.resourceManager);
    this._world = new World();
    this.loop = new GameLoop(60, this._world, this.renderer);
  }

  async init() {
    await this.renderer.init();
    this.loop.start();
  }

  addResourceLoader<T extends Resource>(resourceType: ResourceType, loader: ResourceLoader<T>) {
    this.resourceManager.addLoader(resourceType, loader);
  }

  async load(url: string, resourceType: ResourceType) {
    this.resourceManager.load(url, resourceType);
  }

  getRenderFps(): number {
    return this.loop.getRenderFps();
  }

  getUpdateFps(): number {
    return this.loop.getUpdateFps();
  }

  getGpuTime() {
    return this.renderer.gpuTime;
  }
}

import {
  World,
  GameLoop,
  TransformComponent,
  Color,
  UpdateSystem,
  Entity,
  renderSystem,
  createRectangle,
  MeshComponent,
  MaterialComponent,
  Vec2,
} from "nanojet";

// Get the canvas element from the DOM
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

const world = new World();
const loop = new GameLoop(world, 60, canvas, new Vec2(1152, 648));
await loop.init();

const performanceSystem: UpdateSystem = (world: World, entity: Entity, deltaTimeInMs: number) => {
  // TODO: Just being lazy here and shoving performance timing code in here but it should be extracted
  // to the game loop or some other performance tracking system
  const infoElement = document.getElementById("info") as HTMLPreElement;
  infoElement.textContent = `\
  fps: ${loop.getRenderFps().toFixed(1)}
  ups: ${loop.getUpdateFps().toFixed(1)}
  gpu: ${loop.getGpuTime() !== 0 ? `${(loop.getGpuTime() / 1000).toFixed(1)}µs` : "N/A"}
  `;
};

// Make a rectangle that covers the entire viewport and serves as background
createRectangle(
  world,
  new Vec2(loop.viewportSize.x, loop.viewportSize.y),
  new Color(120, 120, 120, 1),
  new Vec2(loop.viewportSize.x / 2, loop.viewportSize.y / 2)
);

// Add the update systems
//world.addUpdateSystem(["TransformComponent", "VelocityComponent"], movementSystem);
//world.addUpdateSystem(["TransformComponent", "AngularVelocityComponent"], rotationSystem);
world.addUpdateSystem([], performanceSystem);

// Add the render systems
world.addRenderSystem([TransformComponent.name, MeshComponent.name, MaterialComponent.name], renderSystem);

loop.start();

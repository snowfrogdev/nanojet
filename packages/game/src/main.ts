import {
  World,
  GameLoop,
  TransformComponent,
  Color,
  Vec2,
  UpdateSystem,
  VelocityComponent,
  Entity,
  movementSystem,
  AngularVelocityComponent,
  rotationSystem,
  renderSystem,
  createRectangle,
  createCircle,
  MeshComponent,
  MaterialComponent,
} from "nanojet";

// Get the canvas element from the DOM
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

const world = new World();
const loop = new GameLoop(world, 60, canvas);
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

const numEntities = 50;

function getRandom(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

const boundarySystem: UpdateSystem = (world: World, entity: Entity) => {
  const transform = world.getComponent<TransformComponent>(entity, TransformComponent.name);
  const velocity = world.getComponent<VelocityComponent>(entity, VelocityComponent.name);

  if (!transform || !velocity) return;

  const halfWidth = transform.scale.x / 2;
  const halfHeight = transform.scale.y / 2;

  // Check screen boundaries for X-axis
  if (transform.position.x - halfWidth <= 0 || transform.position.x + halfWidth >= canvas.width) {
    velocity.value.x *= -1;
    transform.position.x = Math.max(halfWidth, Math.min(canvas.width - halfWidth, transform.position.x));
  }

  // Check screen boundaries for Y-axis
  if (transform.position.y - halfHeight <= 0 || transform.position.y + halfHeight >= canvas.height) {
    velocity.value.y *= -1;
    transform.position.y = Math.max(halfHeight, Math.min(canvas.height - halfHeight, transform.position.y));
  }
};

for (let i = 0; i < numEntities; i++) {
  let entity;

  // Randomly decide whether to create a rectangle or circle
  const isRectangle = Math.random() < 0.5;

  // Random size
  let entityWidth = 0;
  let entityHeight = 0;

  // Random color
  const color = new Color(getRandom(25, 225), getRandom(25, 225), getRandom(25, 225), getRandom(0.2, 0.8));

  if (isRectangle) {
    // Random width and height
    const width = getRandom(20, 100);
    const height = getRandom(20, 100);

    entityWidth = width;
    entityHeight = height;

    // Add RectangleComponent
    entity = createRectangle(world, width, height, color);
  } else {
    // Random radius
    const radius = getRandom(10, 50);

    entityWidth = radius * 2;
    entityHeight = radius * 2;

    // Add CircleComponent
    entity = createCircle(world, radius, color);
  }

  // Random position within canvas, adjusted for center-origin
  const halfWidth = entityWidth / 2;
  const halfHeight = entityHeight / 2;

  const position = new Vec2(
    getRandom(halfWidth, canvas.width - halfWidth),
    getRandom(halfHeight, canvas.height - halfHeight)
  );

  // Random velocity
  const velocity = new Vec2(
    getRandom(-100, 100), // pixels per second
    getRandom(-100, 100)
  );

  // Random angular velocity (radians per second)
  const angularVelocity = getRandom(-Math.PI, Math.PI); // Rotate between -180 and 180 degrees per second

  world.getComponent<TransformComponent>(entity, TransformComponent.name)!.position = position;
  world.addComponent(entity, VelocityComponent.name, new VelocityComponent(velocity));
  world.addComponent(entity, AngularVelocityComponent.name, new AngularVelocityComponent(angularVelocity));
}

// Add the update systems
world.addUpdateSystem(["TransformComponent", "VelocityComponent"], movementSystem);
world.addUpdateSystem(["TransformComponent", "AngularVelocityComponent"], rotationSystem);
world.addUpdateSystem(["TransformComponent", "VelocityComponent"], boundarySystem);

// Add the render systems
world.addRenderSystem([TransformComponent.name, MeshComponent.name, MaterialComponent.name], renderSystem);
world.addUpdateSystem([], performanceSystem);

loop.start();

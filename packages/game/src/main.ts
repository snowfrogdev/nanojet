import {
  World,
  GameLoop,
  TransformComponent,
  CircleComponent,
  Color,
  RectangleComponent,
  Vec2,
  UpdateSystem,
  VelocityComponent,
  Entity,
  movementSystem,
  renderCircleSystem,
  renderRectangleSystem,
  AngularVelocityComponent,
  rotationSystem,
} from "nanojet";

// Get the canvas element from the DOM
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

const world = new World();
const loop = new GameLoop(world, 60, canvas);
await loop.init();

const boundarySystem: UpdateSystem = (world: World, entity: Entity, deltaTimeInMs: number) => {
  // TODO: Just being lazy here and shoving performance timing code in here but it should be extracted
  // to the game loop or some other performance tracking system
  const infoElement = document.getElementById("info") as HTMLPreElement;
  infoElement.textContent = `\
  fps: ${loop.getRenderFps().toFixed(1)}
  ups: ${loop.getUpdateFps().toFixed(1)}
  gpu: ${loop.getGpuTime() !== 0 ? `${(loop.getGpuTime() / 1000).toFixed(1)}µs` : "N/A"}
  `;

  const transform = world.getComponent<TransformComponent>(entity, "TransformComponent")!;
  const velocity = world.getComponent<VelocityComponent>(entity, "VelocityComponent")!;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Determine entity dimensions
  let entityWidth = 0;
  let entityHeight = 0;

  const rectangle = world.getComponent<RectangleComponent>(entity, "RectangleComponent");
  if (rectangle) {
    entityWidth = rectangle.width;
    entityHeight = rectangle.height;
  } else {
    const circle = world.getComponent<CircleComponent>(entity, "CircleComponent");
    if (circle) {
      entityWidth = circle.radius * 2;
      entityHeight = circle.radius * 2;
    }
  }

  // Calculate half dimensions
  const halfWidth = entityWidth / 2;
  const halfHeight = entityHeight / 2;

  // Bounce off the left and right edges
  if (transform.position.x - halfWidth < 0 || transform.position.x + halfWidth > canvasWidth) {
    velocity.value.x *= -1;

    // Clamp position within bounds
    transform.position.x = Math.max(halfWidth, Math.min(transform.position.x, canvasWidth - halfWidth));
  }

  // Bounce off the top and bottom edges
  if (transform.position.y - halfHeight < 0 || transform.position.y + halfHeight > canvasHeight) {
    velocity.value.y *= -1;

    // Clamp position within bounds
    transform.position.y = Math.max(halfHeight, Math.min(transform.position.y, canvasHeight - halfHeight));
  }
};

const numEntities = 50;

function getRandom(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

for (let i = 0; i < numEntities; i++) {
  const entity = world.addEntity();

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
    world.addComponent(entity, "RectangleComponent", new RectangleComponent(width, height, color));
  } else {
    // Random radius
    const radius = getRandom(10, 50);

    entityWidth = radius * 2;
    entityHeight = radius * 2;

    // Add CircleComponent
    world.addComponent(entity, "CircleComponent", new CircleComponent(radius, color));
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

  // Add TransformComponent, VelocityComponent, and AngularVelocityComponent
  world.addComponent(entity, "TransformComponent", new TransformComponent(position));
  world.addComponent(entity, "VelocityComponent", new VelocityComponent(velocity));
  world.addComponent(entity, "AngularVelocityComponent", new AngularVelocityComponent(angularVelocity));
}

// Add the render systems
world.addRenderSystem(["TransformComponent", "RectangleComponent"], renderRectangleSystem);
world.addRenderSystem(["TransformComponent", "CircleComponent"], renderCircleSystem);

// Add the update systems
world.addUpdateSystem(["TransformComponent", "VelocityComponent"], movementSystem);
world.addUpdateSystem(["TransformComponent", "VelocityComponent", "RectangleComponent"], boundarySystem);
world.addUpdateSystem(["TransformComponent", "VelocityComponent", "CircleComponent"], boundarySystem);
world.addUpdateSystem(["TransformComponent", "AngularVelocityComponent"], rotationSystem);

loop.start();

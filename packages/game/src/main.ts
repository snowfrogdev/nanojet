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
} from "nanojet";

// Get the canvas element from the DOM
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

const world = new World();
const loop = new GameLoop(world, 60, canvas);
const initialization = loop.init();

export const boundarySystem: UpdateSystem = (world: World, entity: Entity, deltaTimeInMs: number) => {
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

  // Bounce off the edges
  if (transform.position.x < 0 || transform.position.x + entityWidth > canvasWidth) {
    velocity.value.x *= -1;
    transform.position.x = Math.max(0, Math.min(transform.position.x, canvasWidth - entityWidth));
  }

  if (transform.position.y < 0 || transform.position.y + entityHeight > canvasHeight) {
    velocity.value.y *= -1;
    transform.position.y = Math.max(0, Math.min(transform.position.y, canvasHeight - entityHeight));
  }
};

const numEntities = 5;

function getRandom(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

for (let i = 0; i < numEntities; i++) {
  const entity = world.addEntity();

  // Randomly decide whether to create a rectangle or circle
  const isRectangle = Math.random() < 0.5;

  // Random position within canvas
  const position = new Vec2(getRandom(0, canvas.width), getRandom(0, canvas.height));

  // Random velocity
  const velocity = new Vec2(
    getRandom(-100, 100), // pixels per second
    getRandom(-100, 100)
  );

  // Random color
  const color = new Color(getRandom(0, 255), getRandom(0, 255), getRandom(0, 255), getRandom(0.1, 0.9));

  // Add TransformComponent and VelocityComponent
  world.addComponent(entity, "TransformComponent", new TransformComponent(position));
  world.addComponent(entity, "VelocityComponent", new VelocityComponent(velocity));

  if (isRectangle) {
    // Random width and height
    const width = getRandom(20, 50);
    const height = getRandom(20, 50);

    // Add RectangleComponent
    world.addComponent(entity, "RectangleComponent", new RectangleComponent(width, height, color));
  } else {
    // Random radius
    const radius = getRandom(10, 25);

    // Add CircleComponent
    world.addComponent(entity, "CircleComponent", new CircleComponent(radius, color));
  }
}

// Add the render systems
world.addRenderSystem(["TransformComponent", "RectangleComponent"], renderRectangleSystem);
world.addRenderSystem(["TransformComponent", "CircleComponent"], renderCircleSystem);

// Add the update systems
world.addUpdateSystem(["TransformComponent", "VelocityComponent"], movementSystem);
world.addUpdateSystem(["TransformComponent", "VelocityComponent"], boundarySystem);

await initialization;
loop.start();

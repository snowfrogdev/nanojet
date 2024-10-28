import { World, Color, GameLoop, RectangleComponent, TransformComponent, Vec2, renderRectangleSystem } from "nanojet";

// Get the canvas element from the DOM
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

// Set the canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const VelocityComponent = (vx: number = 0, vy: number = 0) => ({ x: vx, y: vy });
const TextComponent = (text: string = "", font: string = "16px Arial", color: string = "black") => ({
  text,
  font,
  color,
});

type MyComponents = {
  TransformComponent: TransformComponent;
  RectangleComponent: RectangleComponent;
  VelocityComponent: ReturnType<typeof VelocityComponent>;
  TextComponent: ReturnType<typeof TextComponent>;
};

const world = new World();
const loop = new GameLoop(world, 60, canvas);
const initialization = loop.init();

const playerEntity = world.addEntity();
world.addComponent(playerEntity, "TransformComponent", new TransformComponent());
world.addComponent(playerEntity, "VelocityComponent", VelocityComponent(0, 0));
world.addComponent(playerEntity, "RectangleComponent", new RectangleComponent(32, 32, Color.red()));

const renderFpsEntity = world.addEntity();
world.addComponent(renderFpsEntity, "TransformComponent", new TransformComponent(new Vec2(10, 20)));
world.addComponent(renderFpsEntity, "TextComponent", TextComponent("Render FPS: 0"));
const updateFpsEntity = world.addEntity();
world.addComponent(updateFpsEntity, "TransformComponent", new TransformComponent(new Vec2(10, 40)));
world.addComponent(updateFpsEntity, "TextComponent", TextComponent("Update FPS: 0"));

const keysDown: Record<string, boolean> = {
  w: false,
  s: false,
  a: false,
  d: false,
};

addEventListener("keydown", (event) => (keysDown[event.key] = true));
addEventListener("keyup", (event) => (keysDown[event.key] = false));

world.addInputSystem(["VelocityComponent"], (world, entity) => {
  const velocity = world.getComponent<ReturnType<typeof VelocityComponent>>(entity, VelocityComponent.name)!;
  velocity.x = 0;
  velocity.y = 0;

  if (keysDown.w) {
    velocity.y = -7;
  }
  if (keysDown.s) {
    velocity.y = 7;
  }
  if (keysDown.a) {
    velocity.x = -7;
  }
  if (keysDown.d) {
    velocity.x = 7;
  }

  // Normalize the velocity to handle diagonal movement
  if (velocity.x !== 0 && velocity.y !== 0) {
    const magnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    velocity.x = (velocity.x / magnitude) * 7;
    velocity.y = (velocity.y / magnitude) * 7;
  }
});

world.addUpdateSystem(["TransformComponent", "VelocityComponent"], (world, entity, _deltaTimeInMs) => {
  const transform = world.getComponent<TransformComponent>(entity, TransformComponent.name)!;
  const velocity = world.getComponent<ReturnType<typeof VelocityComponent>>(entity, VelocityComponent.name)!;

  transform.position.set(transform.position.x + velocity.x, transform.position.y + velocity.y);
});

/* world.addRenderSystem(["TransformComponent", "VelocityComponent", "RectangleComponent"], (world, entity, extrapolation) => {
  const transform = world.getComponent(entity, "TransformComponent")!;
  const velocity = world.getComponent(entity, "VelocityComponent")!;
  const rectangle = world.getComponent(entity, "RectangleComponent")!;

  // Clear the canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Render the entity with extrapolated position
  const color = rectangle.color;
  context.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  context.fillRect(
    transform.position.x + velocity.x * extrapolation,
    transform.position.y + velocity.y * extrapolation,
    rectangle.width,
    rectangle.height
  );
}); */

/* world.addRenderSystem(["TransformComponent", "TextComponent"], (world, entity) => {
  const transform = world.getComponent(entity, "TransformComponent")!;
  const text = world.getComponent(entity, "TextComponent")!;

  if (entity === renderFpsEntity) {
    text.text = `Render FPS: ${loop.getRenderFps().toFixed(1)}`;
  }

  if (entity === updateFpsEntity) {
    text.text = `Update FPS: ${loop.getUpdateFps().toFixed(1)}`;
  }

  context.font = text.font;
  context.fillStyle = text.color;
  context.fillText(text.text, transform.position.x, transform.position.y);
}); */

world.addRenderSystem(["TransformComponent", "RectangleComponent"], renderRectangleSystem);

await initialization;
loop.start();

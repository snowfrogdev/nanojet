import { World, Color, GameLoop, RectangleComponent, TransformComponent, Vec2 } from "nanojet";

// Get the canvas element from the DOM
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;

if (!context) {
  throw new Error("Unable to get 2D context");
}

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

const world = new World<MyComponents>();
const loop = new GameLoop(world, 60);

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

world.addInputSystem(["VelocityComponent"], (entity) => {
  const velocity = world.getComponent(entity, "VelocityComponent")!;
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
});

world.addUpdateSystem(["TransformComponent", "VelocityComponent"], (entity, _deltaTimeInMs) => {
  const transform = world.getComponent(entity, "TransformComponent")!;
  const velocity = world.getComponent(entity, "VelocityComponent")!;

  transform.position.set(transform.position.x + velocity.x, transform.position.y + velocity.y);
});

world.addRenderSystem(["TransformComponent", "VelocityComponent", "RectangleComponent"], (entity, extrapolation) => {
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
});

world.addRenderSystem(["TransformComponent", "TextComponent"], (entity) => {
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
});

loop.start();

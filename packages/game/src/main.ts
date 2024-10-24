import { addComponent, addEntity, addInputSystem, addRenderSystem, addUpdateSystem, GameLoop, getComponent } from "nanojet";

// Get the canvas element from the DOM
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;

if (!context) {
  throw new Error("Unable to get 2D context");
}

// Set the canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const loop = new GameLoop(60);

const PositionComponent = (x: number = 0, y: number = 0) => ({ x, y });
const VelocityComponent = (vx: number = 0, vy: number = 0) => ({ x: vx, y: vy });
const SpriteComponent = (width: number = 32, height: number = 32, color: string = "red") => ({ width, height, color });
const TextComponent = (text: string = "", font: string = "16px Arial", color: string = "black") => ({ text, font, color });

const playerEntity = addEntity();
addComponent(playerEntity, PositionComponent.name, PositionComponent(0, 0));
addComponent(playerEntity, VelocityComponent.name, VelocityComponent(0, 0));
addComponent(playerEntity, SpriteComponent.name, SpriteComponent(32, 32, "red"));

const renderFpsEntity = addEntity();
addComponent(renderFpsEntity, PositionComponent.name, PositionComponent(10, 20));
addComponent(renderFpsEntity, TextComponent.name, TextComponent("Render FPS: 0"));
const updateFpsEntity = addEntity();
addComponent(updateFpsEntity, PositionComponent.name, PositionComponent(10, 40));
addComponent(updateFpsEntity, TextComponent.name, TextComponent("Update FPS: 0"));

const keysDown: Record<string, boolean> = {
  w: false,
  s: false,
  a: false,
  d: false,
};

addEventListener("keydown", (event) => (keysDown[event.key] = true));
addEventListener("keyup", (event) => (keysDown[event.key] = false));

addInputSystem([VelocityComponent.name], (entity) => {
  const velocity = getComponent(entity, VelocityComponent.name) as ReturnType<typeof VelocityComponent>;
  velocity.x = 0;
  velocity.y = 0;

  if (keysDown.w) {
    velocity.y = -5;
  }
  if (keysDown.s) {
    velocity.y = 5;
  }
  if (keysDown.a) {
    velocity.x = -5;
  }
  if (keysDown.d) {
    velocity.x = 5;
  }
});

addUpdateSystem([PositionComponent.name, VelocityComponent.name], (entity, _deltaTimeInMs) => {
  const position = getComponent(entity, PositionComponent.name) as ReturnType<typeof PositionComponent>;
  const velocity = getComponent(entity, VelocityComponent.name) as ReturnType<typeof VelocityComponent>;

  position.x += velocity.x;
  position.y += velocity.y;
});

addRenderSystem([PositionComponent.name, VelocityComponent.name, SpriteComponent.name], (entity, extrapolation) => {
  const position = getComponent(entity, PositionComponent.name) as ReturnType<typeof PositionComponent>;
  const velocity = getComponent(entity, VelocityComponent.name) as ReturnType<typeof VelocityComponent>;
  const sprite = getComponent(entity, SpriteComponent.name) as ReturnType<typeof SpriteComponent>;

  // Clear the canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Render the entity with extrapolated position
  context.fillStyle = sprite.color;
  context.fillRect(
    position.x + velocity.x * extrapolation,
    position.y + velocity.y * extrapolation,
    sprite.width,
    sprite.height
  );
});

addRenderSystem([PositionComponent.name, TextComponent.name], (entity) => {
  const position = getComponent(entity, PositionComponent.name) as ReturnType<typeof PositionComponent>;
  const text = getComponent(entity, TextComponent.name) as ReturnType<typeof TextComponent>;

  if (entity === renderFpsEntity) {
    text.text = `Render FPS: ${loop.getRenderFps().toFixed(1)}`;
  }

  if (entity === updateFpsEntity) {
    text.text = `Update FPS: ${loop.getUpdateFps().toFixed(1)}`;
  }
  
  context.font = text.font;
  context.fillStyle = text.color;
  context.fillText(text.text, position.x, position.y);
});

loop.start();

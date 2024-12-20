import {
  World,
  TransformComponent,
  Color,
  UpdateSystem,
  Entity,
  renderSystem,
  createRectangle,
  MeshComponent,
  MaterialComponent,
  Vec2,
  TimerComponent,
  timerSystem,
  TIMER_EVENTS,
  randomInteger,
  randomFloat,
  pickRandom,
  AreaComponent,
  AREA_EVENTS,
  areaSystem,
  Sound,
  Engine,
  TextureLoader,
  createLabel,
  LabelComponent,
  labelSystem,
} from "nanojet";
import { Tags } from "./tags";
import { BallData, ballSystem } from "./ball.system";

const PADDLE_SPEED = 500;
const START_SPEED = 500;

// Get the canvas element from the DOM
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const viewportSize = new Vec2(1152, 648);
const engine = new Engine(canvas, viewportSize);
engine.addResourceLoader("Texture", TextureLoader);

const world = engine.world;

const performanceSystem: UpdateSystem = (_world: World, _entity: Entity, _deltaTimeInMs: number) => {
  // TODO: Just being lazy here and shoving performance timing code in here but it should be extracted
  // to the game loop or some other performance tracking system
  const infoElement = document.getElementById("info") as HTMLPreElement;
  infoElement.textContent = `\
  fps: ${engine.getRenderFps().toFixed(1)}
  ups: ${engine.getUpdateFps().toFixed(1)}
  gpu: ${engine.getGpuTime() !== 0 ? `${(engine.getGpuTime() / 1000).toFixed(1)}µs` : "N/A"}
  `;
};

const keys: { [key: string]: boolean } = {};
window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

let scores = { player: 0, cpu: 0 };

// Make a rectangle that covers the entire viewport and serves as background
createRectangle(
  world,
  new Vec2(viewportSize.x, viewportSize.y),
  new Color(120, 120, 120, 1),
  new Vec2(viewportSize.x / 2, viewportSize.y / 2)
);

const playerScore = createLabel(
  world,
  "0",
  50,
  "monospace",
  new Color(255, 255, 255, 1),
  new Vec2(100, 60),
  new Vec2(viewportSize.x / 2 - 100, 30)
);

const cpuScore = createLabel(
  world,
  "0",
  50,
  "monospace",
  new Color(255, 255, 255, 1),
  new Vec2(100, 60),
  new Vec2(viewportSize.x / 2 + 100, 30)
);

const topBorder = createRectangle(
  world,
  new Vec2(viewportSize.x, 20),
  new Color(255, 255, 255, 1),
  new Vec2(viewportSize.x / 2, -10)
);
world.addComponent(topBorder, Tags.Collider, null);

const bottomBorder = createRectangle(
  world,
  new Vec2(viewportSize.x, 20),
  new Color(255, 255, 255, 1),
  new Vec2(viewportSize.x / 2, viewportSize.y + 10)
);
world.addComponent(bottomBorder, Tags.Collider, null);

const scoreSound = new Sound([1.1, , 688, 0.01, 0.07, 0.14, 1, 2.8, , -18, , , , , , 0.1, , 0.72, 0.03, , 154]);

const scoreAreaLeft = createRectangle(
  world,
  new Vec2(40, viewportSize.y),
  new Color(255, 255, 255, 1),
  new Vec2(-20, viewportSize.y / 2)
);
const scoreAreaLeftComponent = new AreaComponent();
scoreAreaLeftComponent.subscribe(AREA_EVENTS.ENTER, (_payload) => {
  scores.cpu++;
  world.getComponent<LabelComponent>(cpuScore, LabelComponent.name)!.text = scores.cpu.toString();
  scoreSound.play();
  ballTimer.start();
});
world.addComponent(scoreAreaLeft, AreaComponent.name, scoreAreaLeftComponent);

const scoreAreaRight = createRectangle(
  world,
  new Vec2(40, viewportSize.y),
  new Color(255, 255, 255, 1),
  new Vec2(viewportSize.x + 20, viewportSize.y / 2)
);
const scoreAreaRightComponent = new AreaComponent();
scoreAreaRightComponent.subscribe(AREA_EVENTS.ENTER, (_payload) => {
  scores.player++;
  world.getComponent<LabelComponent>(playerScore, LabelComponent.name)!.text = scores.player.toString();
  scoreSound.play();
  ballTimer.start();
});
world.addComponent(scoreAreaRight, AreaComponent.name, scoreAreaRightComponent);

const ball = createRectangle(
  world,
  new Vec2(10, 10),
  new Color(255, 255, 255, 1),
  new Vec2(viewportSize.x / 2, viewportSize.y / 2)
);
const ballTimer = new TimerComponent(1, true);
world.addComponent(ball, TimerComponent.name, ballTimer);

world.addComponent(ball, Tags.Ball, { speed: 0, dir: new Vec2(0, 0) });

ballTimer.subscribe(TIMER_EVENTS.TIMEOUT, () => {
  const transform = world.getComponent<TransformComponent>(ball, TransformComponent.name)!;
  const ballData = world.getComponent<BallData>(ball, Tags.Ball)!;
  transform.position.x = viewportSize.x / 2;
  transform.position.y = randomInteger(200, viewportSize.y - 200);
  ballData.speed = START_SPEED;
  ballData.dir = randomDirection();
});

function randomDirection(): Vec2 {
  const x = pickRandom([-1, 1]);
  const y = randomFloat(-1, 1);
  return new Vec2(x, y).normalize();
}

const player = createRectangle(world, new Vec2(20, 120), new Color(255, 255, 255, 1), new Vec2(50, viewportSize.y / 2));
world.addComponent(player, Tags.Player, null);
world.addComponent(player, Tags.Collider, null);
const playerSystem: UpdateSystem = (world: World, entity: Entity, deltaTimeInSeconds) => {
  const transform = world.getComponent<TransformComponent>(entity, TransformComponent.name)!;
  if (keys["w"]) {
    transform.position.y -= PADDLE_SPEED * deltaTimeInSeconds;
  }
  if (keys["s"]) {
    transform.position.y += PADDLE_SPEED * deltaTimeInSeconds;
  }

  const paddleHeight = transform.scale.y;
  transform.position.y = Math.min(viewportSize.y - paddleHeight / 2, Math.max(paddleHeight / 2, transform.position.y));
};

const cpu = createRectangle(
  world,
  new Vec2(20, 120),
  new Color(255, 255, 255, 1),
  new Vec2(viewportSize.x - 50, viewportSize.y / 2)
);
world.addComponent(cpu, Tags.CPU, null);
world.addComponent(cpu, Tags.Collider, null);

const cpuSystem: UpdateSystem = (world: World, entity: Entity, deltaTimeInSeconds) => {
  const transform = world.getComponent<TransformComponent>(entity, TransformComponent.name)!;
  const ballPosition = world.getComponent<TransformComponent>(ball, TransformComponent.name)!.position;
  const distance = transform.position.y - ballPosition.y;

  let moveBy = 0;
  if (Math.abs(distance) > PADDLE_SPEED * deltaTimeInSeconds) {
    moveBy = PADDLE_SPEED * deltaTimeInSeconds * (distance / Math.abs(distance));
  } else {
    moveBy = distance;
  }

  transform.position.y -= moveBy;

  const paddleHeight = transform.scale.y;
  transform.position.y = Math.min(viewportSize.y - paddleHeight / 2, Math.max(paddleHeight / 2, transform.position.y));
};

// Add the update systems
world.addUpdateSystem([TimerComponent.name], timerSystem);
world.addUpdateSystem([TransformComponent.name, Tags.Player], playerSystem);
world.addUpdateSystem([TransformComponent.name, Tags.CPU], cpuSystem);
world.addUpdateSystem([TransformComponent.name, Tags.Ball], ballSystem);
world.addUpdateSystem([AreaComponent.name], areaSystem);
world.addUpdateSystem([], performanceSystem);

// Add the render systems
world.addRenderSystem([TransformComponent.name, LabelComponent.name], labelSystem);
world.addRenderSystem([TransformComponent.name, MeshComponent.name, MaterialComponent.name], renderSystem);

await engine.init();

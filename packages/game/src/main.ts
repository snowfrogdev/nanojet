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
  TimerComponent,
  timerSystem,
  TIMER_EVENTS,
  randomInteger,
  randomFloat,
  pickRandom,
} from "nanojet";

const PADDLE_SPEED = 500;
const START_SPEED = 500;
const ACCELERATION = 50;
const MAX_MOVEMENT_PER_STEP = 2; // Decreased from 5 to 2

enum Tags {
  Player = "Player",
  Ball = "Ball",
  Collider = "Collider",
  CPU = "CPU",
}

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

const keys: { [key: string]: boolean } = {};
window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

// Make a rectangle that covers the entire viewport and serves as background
createRectangle(
  world,
  new Vec2(loop.viewportSize.x, loop.viewportSize.y),
  new Color(120, 120, 120, 1),
  new Vec2(loop.viewportSize.x / 2, loop.viewportSize.y / 2)
);

const topBorder = createRectangle(
  world,
  new Vec2(loop.viewportSize.x, 20),
  new Color(255, 255, 255, 1),
  new Vec2(loop.viewportSize.x / 2, -10)
);
world.addComponent(topBorder, Tags.Collider, null);

const bottomBorder = createRectangle(
  world,
  new Vec2(loop.viewportSize.x, 20),
  new Color(255, 255, 255, 1),
  new Vec2(loop.viewportSize.x / 2, loop.viewportSize.y + 10)
);
world.addComponent(bottomBorder, Tags.Collider, null);

const ball = createRectangle(
  world,
  new Vec2(10, 10),
  new Color(255, 255, 255, 1),
  new Vec2(loop.viewportSize.x / 2, loop.viewportSize.y / 2)
);
const ballTimer = new TimerComponent(1, true);
world.addComponent(ball, TimerComponent.name, ballTimer);
type BallData = { speed: number; dir: Vec2 };
world.addComponent(ball, Tags.Ball, { speed: 0, dir: new Vec2(0, 0) });

ballTimer.subscribe(TIMER_EVENTS.TIMEOUT, () => {
  const transform = world.getComponent<TransformComponent>(ball, TransformComponent.name)!;
  const ballData = world.getComponent<BallData>(ball, Tags.Ball)!;
  transform.position.x = loop.viewportSize.x / 2;
  transform.position.y = randomInteger(200, loop.viewportSize.y - 200);
  ballData.speed = START_SPEED;
  ballData.dir = randomDirection();
});

function randomDirection(): Vec2 {
  const x = pickRandom([-1, 1]);
  const y = randomFloat(-1, 1);
  return new Vec2(x, y).normalize();
}

const ballSystem: UpdateSystem = (world, entity, deltaTimeInSeconds) => {
  const transform = world.getComponent<TransformComponent>(entity, TransformComponent.name)!;
  const ballData = world.getComponent<BallData>(entity, Tags.Ball)!;

  // Calculate total movement
  const totalMovement = ballData.dir.scale(ballData.speed * deltaTimeInSeconds);
  const movementLength = totalMovement.length();

  // Determine the number of sub-steps
  const steps = Math.ceil(movementLength / MAX_MOVEMENT_PER_STEP);

  // Normalize movement vector for stepping
  const stepMovement = totalMovement.scale(1 / steps);

  // Subdivide movement and perform collision checks
  for (let i = 0; i < steps; i++) {
    // Move ball by step
    const newPos = transform.position.add(stepMovement);

    // Get ball's half size
    const ballHalfSize = transform.scale.scale(0.5);

    let collisionDetected = false;
    let adjustedPos = newPos.copy();
    let newDir = ballData.dir.copy();
    let collidedWithPaddle = false;

    // Check for collisions with colliders
    for (const collider of world.getEntitiesWithComponents([Tags.Collider, TransformComponent.name])) {
      if (collider === entity) continue; // Skip self

      const colliderTransform = world.getComponent<TransformComponent>(collider, TransformComponent.name)!;
      const colliderHalfSize = colliderTransform.scale.scale(0.5);

      // Calculate the difference between centers
      const delta = newPos.subtract(colliderTransform.position);

      // Calculate overlap on each axis
      const overlapX = ballHalfSize.x + colliderHalfSize.x - Math.abs(delta.x);
      const overlapY = ballHalfSize.y + colliderHalfSize.y - Math.abs(delta.y);

      // Check for collision
      if (overlapX > 0 && overlapY > 0) {
        collisionDetected = true;

        // Determine the side of collision and adjust position and direction accordingly
        if (overlapX < overlapY) {
          // Horizontal collision
          adjustedPos.x += delta.x > 0 ? overlapX : -overlapX;
          newDir.x = -ballData.dir.x;

          // Check if collided with paddle
          if (collider === player || collider === cpu) {
            collidedWithPaddle = true;
          }
        } else {
          // Vertical collision
          adjustedPos.y += delta.y > 0 ? overlapY : -overlapY;
          newDir.y = -ballData.dir.y;
        }

        break;
      }
    }

    if (collisionDetected) {
      // Update position to prevent overlap
      transform.position = adjustedPos;
      // Update direction
      ballData.dir = newDir.normalize();

      if (collidedWithPaddle) {
        // Increase speed by ACCELERATION
        ballData.speed += ACCELERATION;
      }

      // Collision occurred, exit loop
      break;
    } else {
      // No collision, update position
      transform.position = newPos;
    }
  }
};

const player = createRectangle(
  world,
  new Vec2(20, 120),
  new Color(255, 255, 255, 1),
  new Vec2(50, loop.viewportSize.y / 2)
);
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
  transform.position.y = Math.min(
    loop.viewportSize.y - paddleHeight / 2,
    Math.max(paddleHeight / 2, transform.position.y)
  );
};

const cpu = createRectangle(
  world,
  new Vec2(20, 120),
  new Color(255, 255, 255, 1),
  new Vec2(loop.viewportSize.x - 50, loop.viewportSize.y / 2)
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
  transform.position.y = Math.min(
    loop.viewportSize.y - paddleHeight / 2,
    Math.max(paddleHeight / 2, transform.position.y)
  );
};

// Add the update systems
world.addUpdateSystem([TimerComponent.name], timerSystem);
world.addUpdateSystem([TransformComponent.name, Tags.Player], playerSystem);
world.addUpdateSystem([TransformComponent.name, Tags.CPU], cpuSystem);
world.addUpdateSystem([TransformComponent.name, Tags.Ball], ballSystem);
world.addUpdateSystem([], performanceSystem);

// Add the render systems
world.addRenderSystem([TransformComponent.name, MeshComponent.name, MaterialComponent.name], renderSystem);

loop.start();

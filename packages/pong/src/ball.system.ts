import { Sound, UpdateSystem, TransformComponent, Vec2 } from "nanojet";
import { Tags } from "./tags";

export const MAX_MOVEMENT_PER_STEP = 2;
export const MAX_Y_VECTOR = 0.6;
export const ACCELERATION = 50;
export const START_SPEED = 500;

export type BallData = { speed: number; dir: Vec2 };

const collisionSound = new Sound([1.2, 0.15, 545, , , 0.01, 1, , , , , , , 0.2, , 0.3, , 0.55, 0.02, , 519]);

export const ballSystem: UpdateSystem = (world, entity, deltaTimeInSeconds) => {
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
        collisionSound.play(); // Play sound on collision

        const [playerEntity] = [...world.getEntitiesWithComponents([Tags.Player])];
        const [cpuEntity] = [...world.getEntitiesWithComponents([Tags.CPU])];
        if (collider === playerEntity || collider === cpuEntity) {
          newDir.x = -ballData.dir.x;

          // Calculate vertical distance between ball and paddle
          const ballY = adjustedPos.y;
          const paddleY = colliderTransform.position.y;
          const paddleHeight = colliderTransform.scale.y;
          const dist = ballY - paddleY;

          newDir.y = (dist / (paddleHeight / 2)) * MAX_Y_VECTOR;

          newDir = newDir.normalize();

          ballData.speed += ACCELERATION;
        } else {
          // Collision with top/bottom borders
          // Reflect vertical direction
          newDir.y = -ballData.dir.y;
        }

        ballData.dir = newDir;

        // Adjust position to prevent overlap
        if (overlapX < overlapY) {
          adjustedPos.x += delta.x > 0 ? overlapX : -overlapX;
        } else {
          adjustedPos.y += delta.y > 0 ? overlapY : -overlapY;
        }

        transform.position = adjustedPos;

        break;
      }
    }

    if (collisionDetected) {
      break;
    } else {
      transform.position = newPos;
    }
  }
};

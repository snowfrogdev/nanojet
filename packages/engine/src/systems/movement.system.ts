import { TransformComponent, VelocityComponent } from "../components";
import { UpdateSystem } from "../ecs";

export const movementSystem: UpdateSystem = (world, entity, deltaTimeInMs) => {
  const transform = world.getComponent<TransformComponent>(entity, TransformComponent.name)!;
  const velocity = world.getComponent<VelocityComponent>(entity, VelocityComponent.name)!;

  const deltaTimeInSeconds = deltaTimeInMs / 1000;
  transform.position.x += velocity.value.x * deltaTimeInSeconds;
  transform.position.y += velocity.value.y * deltaTimeInSeconds;
};

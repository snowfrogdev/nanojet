import { AngularVelocityComponent, TransformComponent } from "../components";
import { UpdateSystem } from "../ecs";

export const rotationSystem: UpdateSystem = (world, entity, deltaTimeInMs) => {
  const transform = world.getComponent<TransformComponent>(entity, TransformComponent.name)!;
  const angularVelocity = world.getComponent<AngularVelocityComponent>(entity, AngularVelocityComponent.name)!;

  const deltaTimeInSeconds = deltaTimeInMs / 1000;
  transform.rotation += angularVelocity.value * deltaTimeInSeconds;
};

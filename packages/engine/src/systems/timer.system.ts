import { TimerComponent } from "../components";
import { UpdateSystem } from "../ecs";

export const timerSystem: UpdateSystem = (world, entity, deltaTimeInSeconds) => {
  const timer = world.getComponent<TimerComponent>(entity, TimerComponent.name);
  if (timer) {
    timer.update(deltaTimeInSeconds);
  }
};

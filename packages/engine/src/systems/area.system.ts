import { UpdateSystem, World, Entity } from "../ecs";
import { AreaComponent } from "../components/area.component";
import { TransformComponent } from "../components/transform.component";
import { AREA_EVENTS } from "../components/area.component";

export const areaSystem: UpdateSystem = (world: World, entity: Entity, _deltaTimeInSeconds: number) => {
  const area = world.getComponent<AreaComponent>(entity, AreaComponent.name)!;
  const areaTransform = world.getComponent<TransformComponent>(entity, TransformComponent.name)!;
  const areaHalfSize = areaTransform.scale.scale(0.5);

  for (const otherEntity of world.getEntitiesWithComponents([TransformComponent.name])) {
    if (otherEntity === entity) continue;

    const otherTransform = world.getComponent<TransformComponent>(otherEntity, TransformComponent.name)!;
    const otherHalfSize = otherTransform.scale.scale(0.5);

    // Check for overlap
    const delta = otherTransform.position.subtract(areaTransform.position);
    const overlapX = areaHalfSize.x + otherHalfSize.x - Math.abs(delta.x);
    const overlapY = areaHalfSize.y + otherHalfSize.y - Math.abs(delta.y);

    const isOverlapping = overlapX > 0 && overlapY > 0;

    const wasOverlapping = area.isOverlapping(otherEntity);

    if (isOverlapping && !wasOverlapping) {
      area.addOverlappingEntity(otherEntity);
      area.publish(AREA_EVENTS.ENTER, { entity: otherEntity });
    } else if (!isOverlapping && wasOverlapping) {
      area.removeOverlappingEntity(otherEntity);
      area.publish(AREA_EVENTS.EXIT, { entity: otherEntity });
    }
  }
};

import { LabelComponent, MaterialComponent } from "../components";
import { Entity, World } from "../ecs";
import { Color, Vec2 } from "../utils";
import { createRectangle } from "./rectangle.prefab";

export function createLabel(
  world: World,
  text: string,
  fontSize = 16,
  fontFamily = "monospace",
  fontColor = new Color(0, 0, 0, 1),
  size = new Vec2(200, 100),
  position = new Vec2()
): Entity {
  const entity = createRectangle(world, size, new Color(255, 255, 255, 1), position);
  world.addComponent(
    entity,
    LabelComponent.name,
    new LabelComponent(text, fontFamily, fontSize, fontColor.toRGBAString())
  );
  const material = world.getComponent<MaterialComponent>(entity, MaterialComponent.name)!;
  material.textureId = entity.toString();
  return entity;
}

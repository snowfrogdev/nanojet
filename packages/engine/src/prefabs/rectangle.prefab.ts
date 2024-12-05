import { TransformComponent } from "../components";
import { MaterialComponent } from "../components/material.component";
import { MeshComponent } from "../components/mesh.component";
import { Entity, World } from "../ecs";
import { Color, Vec2 } from "../utils";

const vertexData = new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5]);
const indexData = new Uint16Array([0, 1, 2, 2, 3, 0]);

export function createRectangle(
  world: World,
  size = new Vec2(1, 1),
  color = new Color(255, 255, 255, 1),
  position = new Vec2()
): Entity {
  const entity = world.addEntity();
  const transform = new TransformComponent();
  transform.scale.set(size.x, size.y);
  transform.position = position;
  world.addComponent(entity, TransformComponent.name, transform);
  world.addComponent(entity, MeshComponent.name, new MeshComponent("rectangle", vertexData, indexData));
  world.addComponent(entity, MaterialComponent.name, new MaterialComponent(color));
  return entity;
}

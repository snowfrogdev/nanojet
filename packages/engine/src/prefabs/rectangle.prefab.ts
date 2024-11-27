import { TransformComponent } from "../components";
import { MaterialComponent } from "../components/material.component";
import { MeshComponent } from "../components/mesh.component";
import { World } from "../ecs";
import { Color } from "../utils";

const vertexData = new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5]);
const indexData = new Uint16Array([0, 1, 2, 2, 3, 0]);

export function createRectangle(world: World, width = 1, height = 1, color = new Color(255, 255, 255, 1)): number {
  const entity = world.addEntity();
  const transform = new TransformComponent();
  transform.scale.set(width, height);
  world.addComponent(entity, TransformComponent.name, transform);
  world.addComponent(entity, MeshComponent.name, new MeshComponent("rectangle", vertexData, indexData));
  world.addComponent(entity, MaterialComponent.name, new MaterialComponent(color));
  return entity;
}

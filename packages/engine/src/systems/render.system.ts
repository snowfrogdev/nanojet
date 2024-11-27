import { TransformComponent } from "../components";
import { MaterialComponent } from "../components/material.component";
import { MeshComponent } from "../components/mesh.component";
import { RenderSystem } from "../ecs";

export const renderSystem: RenderSystem = (world, entity, extrapolation, renderer) => {
  const transform = world.getComponent<TransformComponent>(entity, TransformComponent.name)!;
  const mesh = world.getComponent<MeshComponent>(entity, MeshComponent.name)!;
  const material = world.getComponent<MaterialComponent>(entity, MaterialComponent.name)!;

  renderer.queueDraw(mesh, transform.getMatrix3x3(), material.color);
};

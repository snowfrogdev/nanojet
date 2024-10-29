import { CircleComponent, TransformComponent } from "../components";
import { RenderSystem } from "../ecs";
import { scale } from "../utils/mat3";

export const renderCircleSystem: RenderSystem = (world, entity, extrapolation, renderer) => {
  const transform = world.getComponent<TransformComponent>(entity, TransformComponent.name)!;
  const circle = world.getComponent<CircleComponent>(entity, CircleComponent.name)!;

  // Apply scaling based on the rectangle size
  const modelMatrix = scale(transform.getMatrix3x3(), circle.radius, circle.radius);

  renderer.draw(
    CircleComponent.geometryId,
    CircleComponent.vertexData,
    CircleComponent.indexData,
    modelMatrix,
    circle.color
  );
};

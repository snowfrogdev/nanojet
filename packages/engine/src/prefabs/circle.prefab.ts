import { TransformComponent } from "../components";
import { MaterialComponent } from "../components/material.component";
import { MeshComponent } from "../components/mesh.component";
import { World } from "../ecs";
import { Color } from "../utils";

function generateCircleGeometry(segments: number): { vertexData: Float32Array; indexData: Uint16Array } {
  const vertexData = new Float32Array((segments + 2) * 2); // +2 for center and wrapping
  const indexData = new Uint16Array(segments * 3); // Each triangle (fan) requires 3 indices

  // Center vertex at (0, 0)
  vertexData[0] = 0;
  vertexData[1] = 0;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);

    // Position vertices
    vertexData[(i + 1) * 2] = x;
    vertexData[(i + 1) * 2 + 1] = y;

    // Indices
    if (i < segments) {
      indexData[i * 3] = 0; // center point
      indexData[i * 3 + 1] = i + 1; // current segment
      indexData[i * 3 + 2] = i + 2; // next segment
    }
  }

  return { vertexData, indexData };
}


const circleSegments = 32;
const { vertexData: circleVertexData, indexData: circleIndexData } = generateCircleGeometry(circleSegments);

export function createCircle(world: World, radius: number = 1, color: Color = new Color(255, 255, 255, 1)) {
  const entity = world.addEntity();

  const transform = new TransformComponent();
  transform.scale.set(radius, radius);
  world.addComponent(entity, TransformComponent.name, transform);

  world.addComponent(entity, MeshComponent.name, new MeshComponent("circle", circleVertexData, circleIndexData));

  world.addComponent(entity, MaterialComponent.name, new MaterialComponent(color));

  return entity;
}

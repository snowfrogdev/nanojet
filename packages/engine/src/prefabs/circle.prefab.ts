import { TransformComponent } from "../components";
import { MaterialComponent } from "../components/material.component";
import { MeshComponent } from "../components/mesh.component";
import { Entity, World } from "../ecs";
import { Color, Vec2 } from "../utils";

function generateCircleGeometry(segments: number): { vertexData: Float32Array; indexData: Uint16Array } {
  const vertexData = new Float32Array((segments + 2) * 4); // x, y, u, v per vertex
  const indexData = new Uint16Array(segments * 3); // Each triangle (fan) requires 3 indices

  // Center vertex at (0, 0)
  vertexData[0] = 0;    // x
  vertexData[1] = 0;    // y
  vertexData[2] = 0.5;  // u
  vertexData[3] = 0.5;  // v

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    const index = (i + 1) * 4;

    // Position vertices
    vertexData[index] = x;
    vertexData[index + 1] = y;

    // UV coordinates
    vertexData[index + 2] = (x + 1) / 2;
    vertexData[index + 3] = (y + 1) / 2;

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

export function createCircle(world: World, radius = 1, color = new Color(255, 255, 255, 1), position = new Vec2()): Entity {
  const entity = world.addEntity();

  const transform = new TransformComponent();
  transform.scale.set(radius, radius);
  transform.position = position;
  world.addComponent(entity, TransformComponent.name, transform);
  world.addComponent(entity, MeshComponent.name, new MeshComponent("circle", circleVertexData, circleIndexData));
  world.addComponent(entity, MaterialComponent.name, new MaterialComponent(color));

  return entity;
}

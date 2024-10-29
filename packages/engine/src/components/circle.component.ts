import { Color } from "../utils";

export class CircleComponent {
  static geometryId = "circle";
  static vertexData: Float32Array;
  static indexData: Uint16Array;

  constructor(public radius: number, public color: Color) {
    if (!CircleComponent.vertexData) {
      const { vertexData, indexData } = this.createCircleGeometry();
      CircleComponent.vertexData = vertexData;
      CircleComponent.indexData = indexData;
    }
  }

  private createCircleGeometry(numSegments = 24): {
    vertexData: Float32Array;
    indexData: Uint16Array;
  } {
    const angleStep = (Math.PI * 2) / numSegments;
    const vertexData = new Float32Array((numSegments + 2) * 2); // center + vertices
    const indexData = new Uint16Array(numSegments * 3);

    // Center vertex at (0, 0)
    vertexData[0] = 0;
    vertexData[1] = 0;

    // Generate vertices around the circle
    for (let i = 0; i <= numSegments; ++i) {
      const angle = i * angleStep;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      vertexData[(i + 1) * 2] = x;
      vertexData[(i + 1) * 2 + 1] = y;
    }

    // Generate indices
    for (let i = 0; i < numSegments; ++i) {
      indexData[i * 3] = 0; // center vertex
      indexData[i * 3 + 1] = i + 1;
      indexData[i * 3 + 2] = i + 2;
    }

    return { vertexData, indexData };
  }
}

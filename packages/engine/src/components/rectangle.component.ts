import { Color } from "../utils/color";

export class RectangleComponent {
  static vertexData = new Float32Array([
    -0.5, -0.5, // bottom-left
     0.5, -0.5, // bottom-right
     0.5,  0.5, // top-right
    -0.5,  0.5, // top-left
  ]);

  static indexData = new Uint16Array([0, 1, 2, 2, 3, 0]);
  static geometryId = "rectangle";

  constructor(public width: number, public height: number, public color: Color) {}
}

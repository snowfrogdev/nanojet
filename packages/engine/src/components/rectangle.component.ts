import { Color } from "../utils/color";

export class RectangleComponent {
  static vertexData = new Float32Array([
    0,
    0, // bottom-left
    1,
    0, // bottom-right
    1,
    1, // top-right
    0,
    1, // top-left
  ]);

  static indexData = new Uint16Array([0, 1, 2, 2, 3, 0]);
  static geometryId = "rectangle";
  
  constructor(public width: number, public height: number, public color: Color) {}
}

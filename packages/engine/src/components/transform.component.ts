import { Vec2 } from "../utils/vec2";

export class TransformComponent {
  /**
   * <pre>
   * [a, b,
   *  c, d,
   *  tx, ty]
   * </pre>
   */
  private matrix: [number, number, number, number, number, number];

  constructor(position = new Vec2(), scale = new Vec2(1, 1), rotation = 0) {
    // Identity matrix;
    this.matrix = [1, 0, 0, 1, 0, 0];
    this.position = position;
    this.scale = scale;
    this.rotation = rotation;
  }

  /**
   * Get the position of the transform
   * @returns A new Vec2 with the position. Mutating this Vec2 will not affect the transform.
   */
  get position(): Vec2 {
    return new Vec2(this.matrix[4], this.matrix[5]);
  }

  set position(value: Vec2) {
    this.matrix[4] = value.x;
    this.matrix[5] = value.y;
  }

  get scale(): Vec2 {
    return new Vec2(this.matrix[0], this.matrix[3]);
  }

  set scale(value: Vec2) {
    this.matrix[0] = value.x;
    this.matrix[3] = value.y;
  }

  get rotation(): number {
    return Math.atan2(this.matrix[1], this.matrix[0]);
  }

  set rotation(value: number) {
    const cos = Math.cos(value);
    const sin = Math.sin(value);
    this.matrix[0] = cos;
    this.matrix[1] = sin;
    this.matrix[2] = -sin;
    this.matrix[3] = cos;
  }
}

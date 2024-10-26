import { Vec2 } from "../utils/vec2";

type Matrix2x3 = [number, number, number, number, number, number];

export class TransformComponent {
  private _position: Vec2;
  private _rotation: number; // in radians
  private _scale: Vec2;
  private isDirty = true; // Mark as dirty to ensure the matrix is initialized
  /**
   * <pre>
   * [a, b,
   *  c, d,
   *  tx, ty]
   * </pre>
   */
  private matrix: Matrix2x3;

  constructor(position = new Vec2(), scale = new Vec2(1, 1), rotation = 0) {
    const onChange = () => {
      this.isDirty = true;
    };
    position.setOnChange(onChange);
    this._position = position;
    scale.setOnChange(onChange);
    this._scale = scale;
    this._rotation = rotation;
    this.matrix = [0, 0, 0, 0, 0, 0];
  }

  private updateMatrix() {
    if (!this.isDirty) return;

    const cos = Math.cos(this._rotation);
    const sin = Math.sin(this._rotation);
    const sx = this._scale.x;
    const sy = this._scale.y;

    // Construct the affine transformation matrix
    this.matrix[0] = cos * sx; // a
    this.matrix[1] = sin * sx; // b
    this.matrix[2] = -sin * sy; // c
    this.matrix[3] = cos * sy; // d
    this.matrix[4] = this._position.x; // tx
    this.matrix[5] = this._position.y; // ty

    this.isDirty = false;
  }

  get matrixData(): Matrix2x3 {
    this.updateMatrix();
    return this.matrix;
  }

  // Position
  get position(): Vec2 {
    return this._position;
  }

  set position(value: Vec2) {
    this._position.set(value.x, value.y);
    this.isDirty = true;
  }

  // Scale
  get scale(): Vec2 {
    return this._scale;
  }

  set scale(value: Vec2) {
    this._scale.set(value.x, value.y);
    this.isDirty = true;
  }

  // Rotation
  get rotation(): number {
    return this._rotation;
  }

  set rotation(value: number) {
    this._rotation = value % (2 * Math.PI);
    this.isDirty = true;
  }

  // Translate
  translate(dx: number, dy: number) {
    this._position.x += dx;
    this._position.y += dy;
    // isDirty is set via onChange
  }

  // Rotate
  rotate(deltaAngle: number) {
    this.rotation = (this._rotation + deltaAngle) % (2 * Math.PI);
    // isDirty is set in the rotation setter
  }

  // Set Position
  setPosition(x: number, y: number) {
    this._position.set(x, y);
    // isDirty is set via onChange
  }

  // Set Scale
  setScale(sx: number, sy: number) {
    this._scale.set(sx, sy);
    // isDirty is set via onChange
  }
}

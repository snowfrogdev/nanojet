export class Vec2 {
  private _x: number;
  private _y: number;
  private _onChange: () => void;

  constructor(x = 0, y = 0, onChange?: () => void) {
    this._x = x;
    this._y = y;
    this._onChange = onChange || (() => {});
  }

  get x() {
    return this._x;
  }

  set x(value: number) {
    if (this._x !== value) {
      this._x = value;
      this._onChange();
    }
  }

  get y() {
    return this._y;
  }

  set y(value: number) {
    if (this._y !== value) {
      this._y = value;
      this._onChange();
    }
  }

  set(x: number, y: number) {
    if (this._x !== x || this._y !== y) {
      this._x = x;
      this._y = y;
      this._onChange();
    }
  }

  setOnChange(value: () => void) {
    this._onChange = value;
  }

  add(vec: Vec2): Vec2 {
    return new Vec2(this._x + vec.x, this._y + vec.y);
  }

  copy(): Vec2 {
    return new Vec2(this._x, this._y);
  }

  dot(vec: Vec2): number {
    return this._x * vec.x + this._y * vec.y;
  }

  length(): number {
    return Math.sqrt(this._x * this._x + this._y * this._y);
  }

  normalize(): Vec2 {
    const length = this.length();
    return new Vec2(this._x / length, this._y / length);
  }

  scale(value: number): Vec2 {
    return new Vec2(this._x * value, this._y * value);
  }

  subtract(vec: Vec2): Vec2 {
    return new Vec2(this._x - vec.x, this._y - vec.y);
  }
}

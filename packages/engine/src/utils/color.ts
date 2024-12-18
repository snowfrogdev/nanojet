export class Color {
  /**
   * Create a new color
   * @param r Red - 0 to 255
   * @param g Green - 0 to 255
   * @param b Blue - 0 to 255
   * @param a Alpha - 0 to 1
   */
  constructor(public r = 255, public g = 255, public b = 255, public a = 1) {}

  static red(alpha: number = 1): Color {
    return new Color(255, 0, 0, alpha);
  }

  toFloat32Array(): Float32Array {
    return new Float32Array([this.r / 255, this.g / 255, this.b / 255, this.a]);
  }

  toRGBAString(): string {
    return `rgba(${this.r} ${this.g} ${this.b} / ${this.a})`;
  }
}

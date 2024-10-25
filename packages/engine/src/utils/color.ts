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
}

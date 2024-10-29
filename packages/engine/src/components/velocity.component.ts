import { Vec2 } from "../utils";

export class VelocityComponent {
  /**
   * Constructs an instance of the VelocityComponent.
   *
   * @param value - pixels per second
   */
  constructor(public value = new Vec2()) {}
}

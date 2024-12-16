// @ts-ignore
import { zzfx } from "zzfx";

export class Sound {
  constructor(private zzfxParams: (number | undefined)[]) {}

  play() {
    zzfx(...this.zzfxParams);
  }
}

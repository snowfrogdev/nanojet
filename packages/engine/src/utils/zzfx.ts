// @ts-ignore
import { zzfx } from "zzfx";

export class Sound {
  constructor(private zzfxParams: number[]) {}

  play() {
    zzfx(this.zzfxParams);
  }
}

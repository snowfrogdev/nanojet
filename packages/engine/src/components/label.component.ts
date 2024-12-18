export class LabelComponent {
  private _needsUpdate = true;
  constructor(
    private _text: string,
    private _fontFamily: string,
    private _fontSize: number,
    private _fontColor: string
  ) {}

  get text(): string {
    return this._text;
  }

  set text(value: string) {
    this._text = value;
    this._needsUpdate = true;
  }

  get fontFamily(): string {
    return this._fontFamily;
  }

  set fontFamily(value: string) {
    this._fontFamily = value;
    this._needsUpdate = true;
  }

  get fontSize(): number {
    return this._fontSize;
  }

  set fontSize(value: number) {
    this._fontSize = value;
    this._needsUpdate = true;
  }

  get fontColor(): string {
    return this._fontColor;
  }

  set fontColor(value: string) {
    this._fontColor = value;
    this._needsUpdate = true;
  }

  get needsUpdate(): boolean {
    return this._needsUpdate;
  }

  textureUpdated(): void {
    this._needsUpdate = false;
  }
}

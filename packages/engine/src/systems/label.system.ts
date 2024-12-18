import { LabelComponent, TransformComponent } from "../components";
import { RenderSystem } from "../ecs";

const textContext = new OffscreenCanvas(1, 1).getContext("2d")!;

export const labelSystem: RenderSystem = (world, entity, _extrapolation, renderer) => {
  const label = world.getComponent<LabelComponent>(entity, LabelComponent.name)!;
  const transform = world.getComponent<TransformComponent>(entity, TransformComponent.name)!;

  if (label.needsUpdate) {
    textContext.font = `${label.fontSize}px ${label.fontFamily}`;
    const width = transform.scale.x;
    const height = transform.scale.y;
    textContext.canvas.width = width;
    textContext.canvas.height = height;
    textContext.fillStyle = label.fontColor;
    textContext.font = `${label.fontSize}px ${label.fontFamily}`;
    textContext.clearRect(0, 0, width, height);
    textContext.textAlign = "center";
    textContext.textBaseline = "middle";
    textContext.fillText(label.text, width / 2, height / 2);

    createImageBitmap(textContext.canvas).then((imageBitmap) => {
      renderer.loadTexture(entity.toString(), imageBitmap);
      label.textureUpdated();
    });
  }
};

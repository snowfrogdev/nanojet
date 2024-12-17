import { Resource } from "../resource";
import { ResourceLoader } from "../resource-loader";

export interface Texture extends Resource {
  imageBitmap: ImageBitmap;
}

export const TextureLoader: ResourceLoader<Texture> = async (url: string) => {
  const res = await fetch(url);
  const blob = await res.blob();
  const imageBitmap = await createImageBitmap(blob, { colorSpaceConversion: "none" });

  return { id: url, type: "Texture", imageBitmap };
};

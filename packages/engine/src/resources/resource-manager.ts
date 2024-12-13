import { ResourceLoader } from "./resource-loader";

export class ResourceManager {
  private resources = new Map<string, any>();
  private loaders = new Map<string, ResourceLoader<any>>();

  addLoader<T>(extensions: string[], loader: ResourceLoader<T>): void {
    for (const extension of extensions) {
      this.loaders.set(extension, loader);
    }
  }

  async load(url: string): Promise<void> {
    const extension = url.split(".").pop();
    if (!extension) {
      throw new Error(`No extension found in URL: ${url}`);
    }
    const loader = this.loaders.get(extension);
    if (!loader) {
      throw new Error(`No loader found for extension: ${extension}`);
    }

    const resource = await loader.load(url);
    this.resources.set(url, resource);
  }

  get<T>(url: string): T {
    return this.resources.get(url) as T;
  }
}

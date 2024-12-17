import { Resource, ResourceType } from "./resource";
import { ResourceLoader } from "./resource-loader";

export class ResourceManager {
  private resources: Resource[] = [];
  private loaders = new Map<ResourceType, ResourceLoader<Resource>>();

  addLoader<T extends Resource>(resourceType: ResourceType, loader: ResourceLoader<T>): void {
    this.loaders.set(resourceType, loader);
  }

  async load(url: string, resourceType: ResourceType): Promise<void> {
    const loader = this.loaders.get(resourceType);
    if (!loader) {
      throw new Error(`No loader found for resourceType: ${resourceType}`);
    }

    const resource = await loader(url);
    this.resources.push(resource);
  }

  get(url: string): Resource | undefined {
    return this.resources.find((resource) => resource.id === url);
  }

  getAll(resourceType: ResourceType): Resource[] {
    return this.resources.filter((resource) => resource.type === resourceType);
  }
}

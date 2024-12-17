import { Resource } from "./resource";

export type ResourceLoader<T extends Resource> = (url: string) => Promise<T>;

export type ResourceLoaderFactory<T extends Resource> = (
  device: GPUDevice,
  bindGroupLayout: GPUBindGroupLayout
) => ResourceLoader<T>;

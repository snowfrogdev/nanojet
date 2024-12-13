export interface ResourceLoader<Resource> {
  load(url: string): Promise<Resource>;
}

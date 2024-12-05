import { Renderer } from "./renderer";

export type Entity = number;

export type InputSystem = (world: World, entity: Entity) => void;
export type UpdateSystem = (world: World, entity: Entity, deltaTimeInSeconds: number) => void;
export type RenderSystem = (world: World, entity: Entity, extrapolation: number, renderer: Renderer) => void;

export class World {
  private id = 0;
  private entities: Entity[] = [];
  private components = new Map<string, Map<Entity, unknown>>();
  private inputSystems: { componentNames: string[]; system: InputSystem }[] = [];
  private updateSystems: { componentNames: string[]; system: UpdateSystem }[] = [];
  private renderSystems: { componentNames: string[]; system: RenderSystem }[] = [];

  addEntity() {
    return this.entities.push(this.id) && this.id++;
  }

  addComponent(entity: Entity, componentName: string, component: unknown) {
    if (!this.components.has(componentName)) {
      this.components.set(componentName, new Map());
    }
    this.components.get(componentName)!.set(entity, component);
  }

  getComponent<T>(entity: Entity, componentName: string): T | undefined {
    return this.components.get(componentName)?.get(entity) as T | undefined;
  }

  // Add a system with a processInput function
  addInputSystem(componentNames: string[], system: InputSystem) {
    this.inputSystems.push({ componentNames, system });
  }

  // Add a system with required components and an update function
  addUpdateSystem(componentNames: string[], system: UpdateSystem) {
    this.updateSystems.push({ componentNames, system });
  }

  // Add a system with required components and a render function
  addRenderSystem(componentNames: string[], system: RenderSystem) {
    this.renderSystems.push({ componentNames, system });
  }

  processInput() {
    for (const { componentNames, system } of this.inputSystems) {
      for (const entity of this.entities) {
        if (componentNames.every((componentName) => this.components.get(componentName)!.has(entity))) {
          system(this, entity);
        }
      }
    }
  }

  update(deltaTimeInMs: number) {
    for (const { componentNames, system } of this.updateSystems) {
      for (const entity of this.entities) {
        if (componentNames.every((componentName) => this.components.get(componentName)!.has(entity))) {
          system(this, entity, deltaTimeInMs);
        }
      }
    }
  }

  render(extrapolation: number, renderer: Renderer) {
    for (const { componentNames, system } of this.renderSystems) {
      for (const entity of this.entities) {
        if (componentNames.every((componentName) => this.components.get(componentName)!.has(entity))) {
          system(this, entity, extrapolation, renderer);
        }
      }
    }
  }
}

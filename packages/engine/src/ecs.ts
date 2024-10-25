export type Entity = number;
export type InputSystem = (entity: Entity) => void;
export type UpdateSystem = (entity: Entity, deltaTimeInMs: number) => void;
export type RenderSystem = (entity: Entity, extrapolation: number) => void;

//let id = 0;
//const entities: Entity[] = [];
//const components = new Map<string, Map<Entity, unknown>>();
//const inputSystems: { componentNames: string[]; system: InputSystem }[] = [];
//const updateSystems: { componentNames: string[]; system: UpdateSystem }[] = [];
//const renderSystems: { componentNames: string[]; system: RenderSystem }[] = [];

// Add a new entity and return its ID
//export const addEntity = () => entities.push(id) && id++;

// Add a component to an entity
/* export const addComponent = <T>(entity: Entity, componentName: string, component: T) => {
  if (!components.has(componentName)) {
    components.set(componentName, new Map());
  }
  components.get(componentName)!.set(entity, component);
};

// Get a component from an entity
export const getComponent = (entity: Entity, componentName: string) => components.get(componentName)!.get(entity);

// Add a system with a processInput function
export const addInputSystem = (componentNames: string[], system: InputSystem) =>
  inputSystems.push({ componentNames, system });

// Add a system with required components and an update function
export const addUpdateSystem = (componentNames: string[], system: UpdateSystem) =>
  updateSystems.push({ componentNames, system });

// Add a system with required components and a render function
export const addRenderSystem = (componentNames: string[], system: RenderSystem) =>
  renderSystems.push({ componentNames, system }); */

/* export const processInput = () => {
  for (const { componentNames, system } of inputSystems) {
    for (const entity of entities) {
      if (componentNames.every((componentName) => components.get(componentName)!.has(entity))) {
        system(entity);
      }
    }
  }
};

export const update = (deltaTimeInMs: number) => {
  for (const { componentNames, system } of updateSystems) {
    for (const entity of entities) {
      if (componentNames.every((componentName) => components.get(componentName)!.has(entity))) {
        system(entity, deltaTimeInMs);
      }
    }
  }
};

export const render = (extrapolation: number) => {
  for (const { componentNames, system } of renderSystems) {
    for (const entity of entities) {
      if (componentNames.every((componentName) => components.get(componentName)!.has(entity))) {
        system(entity, extrapolation);
      }
    }
  }
}; */

export class World<Components extends Record<string, unknown>> {
  private id = 0;
  private entities: Entity[] = [];
  private components = new Map<keyof Components, Map<Entity, Components[keyof Components]>>();
  private inputSystems: { componentNames: (keyof Components)[]; system: InputSystem }[] = [];
  private updateSystems: { componentNames: (keyof Components)[]; system: UpdateSystem }[] = [];
  private renderSystems: { componentNames: (keyof Components)[]; system: RenderSystem }[] = [];

  addEntity() {
    return this.entities.push(this.id) && this.id++;
  }

  addComponent<K extends keyof Components>(entity: Entity, componentName: K, component: Components[K]) {
    if (!this.components.has(componentName)) {
      this.components.set(componentName, new Map());
    }
    this.components.get(componentName)!.set(entity, component);
  }

  getComponent<K extends keyof Components>(entity: Entity, componentName: K): Components[K] | undefined {
    return this.components.get(componentName)?.get(entity) as Components[K] | undefined;
  }

  // Add a system with a processInput function
  addInputSystem(componentNames: (keyof Components)[], system: InputSystem) {
    this.inputSystems.push({ componentNames, system });
  }

  // Add a system with required components and an update function
  addUpdateSystem(componentNames: (keyof Components)[], system: UpdateSystem) {
    this.updateSystems.push({ componentNames, system });
  }

  // Add a system with required components and a render function
  addRenderSystem(componentNames: (keyof Components)[], system: RenderSystem) {
    this.renderSystems.push({ componentNames, system });
  }

  processInput() {
    for (const { componentNames, system } of this.inputSystems) {
      for (const entity of this.entities) {
        if (componentNames.every((componentName) => this.components.get(componentName)!.has(entity))) {
          system(entity);
        }
      }
    }
  }

  update(deltaTimeInMs: number) {
    for (const { componentNames, system } of this.updateSystems) {
      for (const entity of this.entities) {
        if (componentNames.every((componentName) => this.components.get(componentName)!.has(entity))) {
          system(entity, deltaTimeInMs);
        }
      }
    }
  }

  render(extrapolation: number) {
    for (const { componentNames, system } of this.renderSystems) {
      for (const entity of this.entities) {
        if (componentNames.every((componentName) => this.components.get(componentName)!.has(entity))) {
          system(entity, extrapolation);
        }
      }
    }
  }
}

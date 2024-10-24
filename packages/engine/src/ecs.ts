export type Entity = number;
export type InputSystem = (entity: Entity) => void;
export type UpdateSystem = (entity: Entity, deltaTimeInMs: number) => void;
export type RenderSystem = (entity: Entity, extrapolation: number) => void;

let id = 0;
const entities: Entity[] = [];
const components = new Map<string, Map<Entity, unknown>>();
const inputSystems: { componentNames: string[]; system: InputSystem }[] = [];
const updateSystems: { componentNames: string[]; system: UpdateSystem }[] = [];
const renderSystems: { componentNames: string[]; system: RenderSystem }[] = [];

// Add a new entity and return its ID
export const addEntity = () => entities.push(id) && id++;

// Add a component to an entity
export const addComponent = <T>(entity: Entity, componentName: string, component: T) => {
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
  renderSystems.push({ componentNames, system });

export const processInput = () => {
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
};

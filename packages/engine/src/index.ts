export * from "./game-loop";

export {
  type Entity,
  type InputSystem,
  type UpdateSystem,
  type RenderSystem,
  addEntity,
  addComponent,
  getComponent,
  addUpdateSystem,
  addRenderSystem,
  addInputSystem,
} from "./ecs";

import { Entity } from "../ecs";
import { EventBus, Unsubscribe } from "../event-bus";

type AreaEventsDefinition = {
  ENTER: { entity: Entity };
  EXIT: { entity: Entity };
};

export const AREA_EVENTS: { [K in keyof AreaEventsDefinition]: K } = {
  ENTER: "ENTER",
  EXIT: "EXIT",
} as const;

export class AreaComponent {
  private eventBus = new EventBus<AreaEventsDefinition>();
  private overlappingEntities = new Set<Entity>();

  publish<T extends keyof AreaEventsDefinition & string>(eventName: T, payload: AreaEventsDefinition[T]): void {
    this.eventBus.publish(eventName, payload);
  }

  subscribe<T extends keyof AreaEventsDefinition & string>(
    eventName: T,
    handlerFn: (payload: AreaEventsDefinition[T]) => void
  ): Unsubscribe {
    return this.eventBus.subscribe(eventName, handlerFn);
  }

  isOverlapping(entity: Entity): boolean {
    return this.overlappingEntities.has(entity);
  }

  addOverlappingEntity(entity: Entity): void {
    this.overlappingEntities.add(entity);
  }

  removeOverlappingEntity(entity: Entity): void {
    this.overlappingEntities.delete(entity);
  }

  getOverlappingEntities(): Set<Entity> {
    return this.overlappingEntities;
  }
}

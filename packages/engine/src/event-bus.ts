//const eventBus = new Comment("event-bus");

/* type EventsDefinition = {
  TIMEOUT: undefined;
};

export const EVENTS: { [K in keyof EventsDefinition]: K } = {
  TIMEOUT: "TIMEOUT",
} as const;

type EventsWithPayload = {
  [K in keyof EventsDefinition]: EventsDefinition[K] extends undefined ? never : K;
}[keyof EventsDefinition];

type EventsWithoutPayload = {
  [K in keyof EventsDefinition]: EventsDefinition[K] extends undefined ? K : never;
}[keyof EventsDefinition];

// Function overloads for events with and without payloads
export function publish<T extends EventsWithPayload>(eventName: T, payload: EventsDefinition[T]): void;
export function publish<T extends EventsWithoutPayload>(eventName: T): void;

export function publish<T extends keyof EventsDefinition>(eventName: T, payload?: EventsDefinition[T]): void {
  const event = payload ? new CustomEvent(eventName, { detail: payload }) : new CustomEvent(eventName);
  eventBus.dispatchEvent(event);
}

export type Unsubscribe = () => void;

function isCustomEvent(event: Event): event is CustomEvent {
  return "detail" in event;
}

export function subscribe<T extends keyof EventsDefinition>(
  eventName: T,
  handlerFn: (payload: EventsDefinition[T]) => void
): Unsubscribe {
  const eventHandler = (event: Event) => {
    if (isCustomEvent(event)) {
      const eventPayload: EventsDefinition[T] = event.detail;
      handlerFn(eventPayload);
    }
  };
  eventBus.addEventListener(eventName, eventHandler);
  return () => {
    eventBus.removeEventListener(eventName, eventHandler);
  };
} */

export type Unsubscribe = () => void;
type EventsWithPayload<EventsDefinition> = {
  [K in keyof EventsDefinition]: EventsDefinition[K] extends undefined ? never : K;
}[keyof EventsDefinition];

type EventsWithoutPayload<EventsDefinition> = {
  [K in keyof EventsDefinition]: EventsDefinition[K] extends undefined ? K : never;
}[keyof EventsDefinition];

export class EventBus<EventsDefinition extends Record<string, any>> {
  private eventTarget: EventTarget;

  constructor() {
    this.eventTarget = new EventTarget();
  }

  publish<T extends EventsWithPayload<EventsDefinition>>(eventName: T, payload: EventsDefinition[T]): void;
  publish<T extends EventsWithoutPayload<EventsDefinition>>(eventName: T): void;
  publish<T extends keyof EventsDefinition & string>(eventName: T, payload?: EventsDefinition[T]): void {
    const event = payload ? new CustomEvent(eventName, { detail: payload }) : new CustomEvent(eventName);
    this.eventTarget.dispatchEvent(event);
  }

  subscribe<T extends keyof EventsDefinition & string>(
    eventName: T,
    handlerFn: (payload: EventsDefinition[T]) => void
  ): Unsubscribe {
    const eventHandler = (event: Event) => {
      if (this.isCustomEvent(event)) {
        const eventPayload: EventsDefinition[T] = event.detail;
        handlerFn(eventPayload);
      }
    };
    this.eventTarget.addEventListener(eventName, eventHandler);
    return () => {
      this.eventTarget.removeEventListener(eventName, eventHandler);
    };
  }

  private isCustomEvent(event: Event): event is CustomEvent {
    return "detail" in event;
  }
}

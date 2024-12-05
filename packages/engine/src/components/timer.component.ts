import { EventBus, Unsubscribe } from "../event-bus";

type TimerEventsDefinition = {
  TIMEOUT: undefined;
};

export const TIMER_EVENTS: { [K in keyof TimerEventsDefinition]: K } = {
  TIMEOUT: "TIMEOUT",
} as const;

export class TimerComponent {
  private eventBus = new EventBus<TimerEventsDefinition>();
  private _timeLeft = 0;
  get timeLeft() {
    return this._timeLeft;
  }

  constructor(private durationInSeconds: number, autoStart = false) {
    if (autoStart) this.start();
  }

  start(durationInSeconds = -1) {
    if (this.timeLeft !== 0) return;
    if (durationInSeconds > 0) this.durationInSeconds = durationInSeconds;

    this._timeLeft = this.durationInSeconds;
  }

  update(deltaTimeInSeconds: number) {
    if (this.timeLeft === 0) return;

    this._timeLeft -= deltaTimeInSeconds;
    if (this.timeLeft < 0) {
      this._timeLeft = 0;
      this.eventBus.publish(TIMER_EVENTS.TIMEOUT);
    }
  }

  subscribe<T extends keyof TimerEventsDefinition & string>(
    eventName: T,
    handlerFn: (payload: TimerEventsDefinition[T]) => void
  ): Unsubscribe {
    return this.eventBus.subscribe(eventName, handlerFn);
  }
}

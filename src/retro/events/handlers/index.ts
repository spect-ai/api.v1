import { RetroCreatedEventHandler } from './retro-created.handler';
import { RetroUpdatedEventHandler } from './retro-updated.handler';
import { RetroEndedEventHandler } from './retro-ended.handler';

export const EventHandlers = [
  RetroCreatedEventHandler,
  RetroUpdatedEventHandler,
  RetroEndedEventHandler,
];

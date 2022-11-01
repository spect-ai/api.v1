import { DataAddedEventHandler } from './handlers/data-added.handler';
import { DataRemovedEventHandler } from './handlers/data-removed.handler';
import { DataUpatedEventHandler } from './handlers/data-updated.handler';

export * from './impl/data-added.event';
export * from './impl/data-updated.event';
export * from './impl/data-removed.event';

export const EventHandlers = [
  DataAddedEventHandler,
  DataUpatedEventHandler,
  DataRemovedEventHandler,
];

import { CardCreatedEventHandler } from './card-created.handler';
import { CardUpdatedEventHandler } from './card-updated.handler';
import { WorkThreadCreatedEventHandler } from '../work/handlers/work-thread-created.handler';
import { WorkUnitCreatedEventHandler } from '../work/handlers/work-unit-created.handler';

export const EventHandlers = [
  CardCreatedEventHandler,
  CardUpdatedEventHandler,
  WorkThreadCreatedEventHandler,
  WorkUnitCreatedEventHandler,
];

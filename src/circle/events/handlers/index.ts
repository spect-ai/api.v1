import { JoinedCircleEventHandler } from './joined-circle.handler';
import { LeftCircleEventHandler } from './left-circle.handler';
import { CreatedCircleEventHandler } from './created-circle.handler';
import { UpdatedCircleEventHandler } from './updated-circle.handler';

export const EventHandlers = [
  JoinedCircleEventHandler,
  LeftCircleEventHandler,
  CreatedCircleEventHandler,
  UpdatedCircleEventHandler,
];

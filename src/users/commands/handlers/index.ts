import { RemoveItemsCommandHandler } from './remove-items.handler';
import { AddItemCommandHandler } from './add-items.handler';
import { MoveItemCommandHandler } from './move-item.handler';
import { ReadNotificationCommandHandler } from '../notifications/handlers/read-notifications.handler';

export const CommandHandlers = [
  AddItemCommandHandler,
  MoveItemCommandHandler,
  RemoveItemsCommandHandler,
  ReadNotificationCommandHandler,
];

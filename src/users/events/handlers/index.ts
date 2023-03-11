import {
  NotificationEventV2Handler,
  SingleEmailNotificationEventHandler,
  SingleNotificationEventHandler,
} from './notification.handler';
import { UserCreatedEventHandler } from './user-created.handler';

export const EventHandlers = [
  UserCreatedEventHandler,
  NotificationEventV2Handler,
  SingleNotificationEventHandler,
  SingleEmailNotificationEventHandler,
];

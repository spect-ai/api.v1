import {
  NotificationEventHandler,
  NotificationEventV2Handler,
  SingleEmailNotificationEventHandler,
  SingleNotificationEventHandler,
} from './notification.handler';
import { UserActivityEventHandler } from './user-activity.handler';
import { UserCreatedEventHandler } from './user-created.handler';

export const EventHandlers = [
  NotificationEventHandler,
  UserActivityEventHandler,
  UserCreatedEventHandler,
  NotificationEventV2Handler,
  SingleNotificationEventHandler,
  SingleEmailNotificationEventHandler,
];

import { GetProfileQueryHandler } from './get-profile.handler';
import {
  GetUserByIdQueryHandler,
  GetUserByUsernameQueryHandler,
  GetMultipleUsersByIdsQueryHandler,
  GetUserByFilterQueryHandler,
  GetMultipleUsersByFilterQueryHandler,
} from './get-user.handler';

import { GetMeQueryHandler } from './get-me.handler';
import {
  GetNotificationsQueryHandler,
  GetUnreadNotificationsQueryHandler,
} from './get-notifications.handler';

export const QueryHandlers = [
  GetUserByIdQueryHandler,
  GetUserByUsernameQueryHandler,
  GetMultipleUsersByIdsQueryHandler,
  GetUserByFilterQueryHandler,
  GetProfileQueryHandler,
  GetMeQueryHandler,
  GetNotificationsQueryHandler,
  GetUnreadNotificationsQueryHandler,
  GetMultipleUsersByFilterQueryHandler,
];

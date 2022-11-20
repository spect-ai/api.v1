import { GetProfileByIdQueryHandler } from './get-profile.handler';
import {
  GetUserByIdQueryHandler,
  GetUserByUsernameQueryHandler,
  GetMultipleUsersByIdsQueryHandler,
  GetUserByFilterQueryHandler,
  GetMultipleUsersByFilterQueryHandler,
} from './get-user.handler';

import { GetMeQueryHandler } from './get-me.handler';
import { GetNotificationsQueryHandler } from './get-notifications.handler';

export const QueryHandlers = [
  GetUserByIdQueryHandler,
  GetUserByUsernameQueryHandler,
  GetMultipleUsersByIdsQueryHandler,
  GetUserByFilterQueryHandler,
  GetProfileByIdQueryHandler,
  GetMeQueryHandler,
  GetNotificationsQueryHandler,
  GetMultipleUsersByFilterQueryHandler,
];

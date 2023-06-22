import { GetProfileQueryHandler } from './get-profile.handler';
import {
  GetMultipleUsersByIdsQueryHandler,
  GetUserByFilterQueryHandler,
  GetMultipleUsersByFilterQueryHandler,
} from './get-user.handler';

import { GetMeQueryHandler } from './get-me.handler';
import {
  GetNotificationsQueryHandler,
  GetUnreadNotificationsQueryHandler,
} from './get-notifications.handler';
import {
  GetTokensOfMultipleTokenTypesOfUserQueryHandler,
  GetTokensOfUserQueryHandler,
} from './get-tokens.handler';

export const QueryHandlers = [
  GetMultipleUsersByIdsQueryHandler,
  GetUserByFilterQueryHandler,
  GetProfileQueryHandler,
  GetMeQueryHandler,
  GetNotificationsQueryHandler,
  GetUnreadNotificationsQueryHandler,
  GetMultipleUsersByFilterQueryHandler,
  GetTokensOfUserQueryHandler,
  GetTokensOfMultipleTokenTypesOfUserQueryHandler,
];

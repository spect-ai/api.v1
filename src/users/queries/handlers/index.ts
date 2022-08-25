import {
  GetUserByIdQueryHandler,
  GetUserByUsernameQueryHandler,
  GetMultipleUsersByIdsQueryHandler,
  GetUserByFilterQueryHandler,
} from './get-user.handler';

export const QueryHandlers = [
  GetUserByIdQueryHandler,
  GetUserByUsernameQueryHandler,
  GetMultipleUsersByIdsQueryHandler,
  GetUserByFilterQueryHandler,
];

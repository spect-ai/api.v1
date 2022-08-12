import {
  GetUserByIdQueryHandler,
  GetUserByUsernameQueryHandler,
  GetMultipleUsersByIdsQueryHandler,
} from './get-user.handler';

export const QueryHandlers = [
  GetUserByIdQueryHandler,
  GetUserByUsernameQueryHandler,
  GetMultipleUsersByIdsQueryHandler,
];

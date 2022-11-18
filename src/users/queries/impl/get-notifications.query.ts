import { User } from 'src/users/model/users.model';

export class GetNotificationsQuery {
  constructor(public readonly caller: User) {}
}

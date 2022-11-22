import { User } from 'src/users/model/users.model';

export class SetUnreadNotificationsCommand {
  constructor(public readonly caller: User) {}
}

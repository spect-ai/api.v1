import { User } from 'src/users/model/users.model';

export class UserCreatedEvent {
  constructor(public readonly card: User) {}
}

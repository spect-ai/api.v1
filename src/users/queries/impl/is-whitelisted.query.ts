import { User } from 'src/users/model/users.model';

export class IsWhitelistedQuery {
  constructor(public readonly caller: User) {}
}

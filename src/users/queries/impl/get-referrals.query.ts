import { User } from 'src/users/model/users.model';

export class GetReferralsQuery {
  constructor(public readonly caller: User) {}
}

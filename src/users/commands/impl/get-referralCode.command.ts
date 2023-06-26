import { User } from 'src/users/model/users.model';

export class GetReferralCodeCommand {
  constructor(public readonly user: User) {}
}

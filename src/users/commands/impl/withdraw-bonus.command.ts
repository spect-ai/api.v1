import { User } from 'src/users/model/users.model';

export class WithdrawBonusCommand {
  constructor(public readonly user: User) {}
}

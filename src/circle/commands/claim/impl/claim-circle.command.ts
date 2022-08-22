import { User } from 'src/users/model/users.model';

export class ClaimCircleCommand {
  constructor(public readonly id: string, public readonly caller: User) {}
}

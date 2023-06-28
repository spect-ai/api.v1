import { User } from 'src/users/model/users.model';

export class CancelPlanCommand {
  constructor(public readonly id: string, public readonly caller: User) {}
}

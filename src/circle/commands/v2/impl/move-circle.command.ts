import { User } from 'src/users/model/users.model';

export class MoveCircleCommand {
  constructor(
    public readonly circleSlug: string,
    public readonly destinationCircleSlug: string,
    public readonly caller: User,
  ) {}
}

import { User } from 'src/users/model/users.model';

export class RemoveEducationCommand {
  constructor(
    public readonly educationId: string,
    public readonly user: User,
  ) {}
}

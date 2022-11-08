import { User } from 'src/users/model/users.model';

export class RemoveExperienceCommand {
  constructor(
    public readonly experienceId: string,
    public readonly user: User,
  ) {}
}

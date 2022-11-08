import { UpdateExperienceDto } from 'src/users/dto/experience.dto';
import { User } from 'src/users/model/users.model';

export class UpdateExperienceCommand {
  constructor(
    public readonly experienceId: string,
    public readonly experience: UpdateExperienceDto,
    public readonly user: User,
  ) {}
}

import {
  AddExperienceDto,
  AddMultipleExperiencesDto,
} from 'src/users/dto/experience.dto';
import { User } from 'src/users/model/users.model';

export class AddExperienceCommand {
  constructor(
    public readonly experience: AddExperienceDto,
    public readonly user: User,
  ) {}
}

export class AddMultipleExperienceCommand {
  constructor(
    public readonly experience: AddMultipleExperiencesDto,
    public readonly user: User,
  ) {}
}

import {
  AddEducationDto,
  AddMultipleEducationDto,
} from 'src/users/dto/education.dto';
import { User } from 'src/users/model/users.model';

export class AddEducationCommand {
  constructor(
    public readonly education: AddEducationDto,
    public readonly user: User,
  ) {}
}

export class AddMultipleEducationCommand {
  constructor(
    public readonly education: AddMultipleEducationDto,
    public readonly user: User,
  ) {}
}

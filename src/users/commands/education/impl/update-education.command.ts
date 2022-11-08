import { UpdateEducationDto } from 'src/users/dto/education.dto';
import { User } from 'src/users/model/users.model';

export class UpdateEducationCommand {
  constructor(
    public readonly educationId: string,
    public readonly education: UpdateEducationDto,
    public readonly user: User,
  ) {}
}

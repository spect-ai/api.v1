import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { User } from 'src/users/model/users.model';

export class UpdateUserCommand {
  constructor(
    public readonly updateUserDto: UpdateUserDto,
    public readonly user?: User,
    public readonly userId?: string,
  ) {}
}

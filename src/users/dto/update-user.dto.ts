import { PartialType } from '@nestjs/swagger';
import { User } from './create-user.dto';

export class UpdateUserDto extends PartialType(User) {}

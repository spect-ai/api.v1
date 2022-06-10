import { PartialType } from '@nestjs/swagger';
import { User } from '../model/users.model';

export class UpdateUserDto extends PartialType(User) {}

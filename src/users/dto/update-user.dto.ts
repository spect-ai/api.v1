import { PartialType } from '@nestjs/swagger';
import { User } from '../model/users.model';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(User) {
  /**
   * The name of the user
   */
  @IsString()
  @IsOptional()
  username: string;

  /**
   * The name of the user
   */
  @IsString()
  @IsOptional()
  avatar?: string;
}

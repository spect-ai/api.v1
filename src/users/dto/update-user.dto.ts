import { PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsNullableEmail } from 'src/common/validators/isNullableEmail.validator';
import { User } from '../model/users.model';

export class UpdateUserDto extends PartialType(User) {
  /**
   * The username of the user
   */
  @IsString()
  @IsOptional()
  username?: string;

  /**
   * Bio of the user
   */
  @IsString()
  @IsOptional()
  bio?: string;

  /**
   * The avatar of the user
   */
  @IsString()
  @IsOptional()
  avatar?: string;

  /**
   * Github Id associated with the profile
   */
  @IsString()
  @IsOptional()
  githubId?: string;

  /**
   * EMail of user
   */
  @IsNullableEmail()
  @IsOptional()
  email?: string;
}

export class ReadNotificationDto {
  /**
   * The notification ids to mark as read.
   */
  @IsArray()
  @IsNotEmpty()
  notificationIds: string[];
}

import { PartialType } from '@nestjs/swagger';
import { User } from '../model/users.model';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsNullableEmail } from 'src/common/validators/isNullableEmail.validator';
import { LensSkills } from '../types/types';

export class UpdateUserDto extends PartialType(User) {
  /**
   * The username of the user
   */
  @IsString()
  @IsOptional()
  username: string;

  /**
   * Bio of the user
   */
  @IsString()
  @IsOptional()
  bio?: string;

  /**
   * Skills of the user
   */
  @IsArray()
  @IsOptional()
  skills?: string[];

  /**
   * The avatar of the user
   */
  @IsString()
  @IsOptional()
  avatar?: string;

  /**
   * Discord Id associated with the profile
   */
  @IsString()
  @IsOptional()
  discordId?: string;

  /**
   * Discord username associated with the profile
   */
  @IsString()
  @IsOptional()
  discordUsername?: string;

  /**
   * Github Id associated with the profile
   */
  @IsString()
  @IsOptional()
  githubId?: string;

  /**
   * Twitter account associated with the profile
   */
  @IsString()
  @IsOptional()
  twitter?: string;

  /**
   * Github account associated with the profile
   */
  @IsString()
  @IsOptional()
  github?: string;

  /**
   * Behance account associated with the profile
   */
  @IsString()
  @IsOptional()
  behance?: string;

  /**
   * Website account associated with the profile
   */
  @IsString()
  @IsOptional()
  website?: string;

  /**
   * EMail of user
   */
  @IsNullableEmail()
  @IsOptional()
  email?: string;

  /**
   * Experience order of user
   */
  @IsArray()
  @IsOptional()
  experienceOrder?: string[];

  /**
   * Education order of user
   */
  @IsArray()
  @IsOptional()
  educationOrder?: string[];

  @IsString()
  @IsOptional()
  lensHandle?: string;

  @IsArray()
  @IsOptional()
  skillsV2?: LensSkills[];
}

export class UpdateMetadata {
  /**
   * The cards user is assigned to or reviewed.
   */
  @IsString()
  @IsOptional()
  cards?: string[];

  /**
   * The projects that the user is a member of.
   */
  @IsString()
  @IsOptional()
  projects?: string[];

  /**
   * The circles that the user is a member of.
   */
  @IsString()
  @IsOptional()
  circles?: string[];
}

export class ReadNotificationDto {
  /**
   * The notification ids to mark as read.
   */
  @IsArray()
  @IsNotEmpty()
  notificationIds: string[];
}

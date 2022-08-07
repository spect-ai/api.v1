import { PartialType } from '@nestjs/swagger';
import { User } from '../model/users.model';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(User) {
  /**
   * The username of the user
   */
  @IsString()
  @IsOptional()
  username: string;

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
   * Github Id associated with the profile
   */
  @IsString()
  @IsOptional()
  githubId?: string;
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

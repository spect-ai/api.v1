import { OmitType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { DiscordToCircleRoles } from '../types';
import { CreateCircleV1RequestDto } from './create-circle-v1.dto';

export class UpdateCircleV1RequestDto extends OmitType(
  CreateCircleV1RequestDto,
  ['name', 'parent'] as const,
) {
  /**
   * The name of the circle
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  /**
   * The members of the circle
   */
  @IsArray()
  @IsOptional()
  members?: string[];

  /**
   * The roles of members of the circle
   */
  @IsArray()
  @IsOptional()
  memberRoles?: string[];

  /**
   * Circle is archived if true
   */
  @IsBoolean()
  @IsOptional()
  archived?: boolean;

  /**
   * Discord server id of the circle
   */
  @IsString()
  @IsOptional()
  discordGuildId?: string;

  /**
   * A list of roles that the circle has
   */
  @IsObject()
  @IsOptional()
  discordToCircleRoles?: DiscordToCircleRoles;

  /**
   * A list of repos that the circle uses
   */
  @IsArray()
  @IsOptional()
  githubRepos?: string[];

  /**
   * Gradient color of the circle
   */
  @IsString()
  @IsOptional()
  gradient?: string;
}
import { OmitType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { DiscordToCircleRoles } from '../model/circle.model';
import { CreateCircleRequestDto } from './create-circle-request.dto';

export class UpdateCircleRequestDto extends OmitType(CreateCircleRequestDto, [
  'name',
  'parent',
] as const) {
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
}

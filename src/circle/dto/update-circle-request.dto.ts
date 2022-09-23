import { OmitType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  DiscordToCircleRoles,
  GuildxyzToCircleRoles,
} from '../model/circle.model';
import { DiscordChannel, SafeAddresses } from '../types';
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
   * Guild.xyz guild
   */
  @IsNumber()
  @IsOptional()
  guildxyzId?: number;

  /**
   * guild xyz role mapping
   */
  @IsObject()
  @IsOptional()
  guildxyzToCircleRoles?: GuildxyzToCircleRoles;

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

  /**
   * Gradient color of the circle
   */
  @IsObject()
  @IsOptional()
  safeAddresses?: SafeAddresses;

  /**
   * A list of labels that the circle uses
   */
  @IsArray()
  @IsOptional()
  labels?: string[];

  @IsString()
  @IsOptional()
  questbookWorkspaceUrl?: string;
  @IsString()
  @IsOptional()
  questbookWorkspaceId?: string;

  @IsString()
  @IsOptional()
  grantMilestoneProject?: string;

  @IsString()
  @IsOptional()
  grantApplicantProject?: string;

  /**
   * Payment address of the circle
   */
  @IsString()
  @IsOptional()
  paymentAddress?: string;

  /**
   * Discord Channel to get notifications on when grant is approved
   */
  @IsObject()
  @IsOptional()
  grantNotificationChannel?: DiscordChannel;
}

export class UpdateCircleGithubRepoRequestDto {
  /**
   * A list of repos that the circle uses
   */
  @IsArray()
  githubRepos?: string[];

  // @IsString()
  // githubId: string;
}

export class AddWhitelistedAddressRequestDto {
  @IsString()
  ethAddress: string;
  /**
   * A list of roles given to whitelisted address
   */
  @IsArray()
  roles: string[];
}

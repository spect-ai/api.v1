import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Option } from '../types/types';

export class LinkDiscordDto {
  @IsString()
  readonly threadName: string;

  @IsObject()
  readonly selectedChannel: Option;

  @IsBoolean()
  readonly isPrivate: boolean;

  @IsObject()
  readonly rolesToAdd: object;

  @IsArray()
  readonly stakeholdersToAdd: string[];
}

export class LinkDiscordThreadToDataDto {
  @IsString()
  readonly threadId: string;

  @IsString()
  @IsString()
  readonly guildId: string;

  @IsOptional()
  @IsBoolean()
  readonly isPrivate: object;
}

export class LinkDiscordToCollectionDto {
  @IsString()
  readonly threadName: string;

  @IsObject()
  readonly selectedChannel: Option;

  @IsOptional()
  @IsBoolean()
  readonly isPrivate: boolean;

  @IsOptional()
  @IsObject()
  readonly rolesToAdd: object;

  @IsOptional()
  @IsArray()
  readonly stakeholdersToAdd: string[];
}

export class NextFieldRequestDto {
  @IsString()
  readonly discordId: string;

  @IsString()
  readonly discordChannelId: string;
}

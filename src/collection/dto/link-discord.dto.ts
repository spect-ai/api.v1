import { IsArray, IsBoolean, IsObject, IsString } from 'class-validator';
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

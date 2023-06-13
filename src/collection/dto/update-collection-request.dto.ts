import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { MappedItem } from 'src/common/interfaces';
import { GuildRole } from 'src/common/types/role.type';
import { FormMetadata, ProjectMetadata } from '../model/collection.model';
import { Permissions, Property } from '../types/types';
import { Voting } from '../types/types';

export class UpdateCollectionDto {
  /**
   * The name collection
   */
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * The description of creating this collection
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * The guild.xyz roles that a person needs to hold to fill up form
   */
  @IsArray()
  @IsOptional()
  formRoleGating: GuildRole[];

  /**
   * The mintkudos token id to distribute when a person fills the form
   */
  @IsNumber()
  @IsOptional()
  mintkudosTokenId: number;

  /**
   * Send email to circle members upon new response
   */
  @IsArray()
  @IsOptional()
  circleRolesToNotifyUponNewResponse: string[];

  /**
   * Send email to circle members upon updated response
   */
  @IsArray()
  @IsOptional()
  circleRolesToNotifyUponUpdatedResponse: string[];

  /**
   * The updated property order
   */
  @IsArray()
  @IsOptional()
  propertyOrder: string[];

  /**
   * The updated property order
   */
  @IsObject()
  @IsOptional()
  properties: MappedItem<Property>;

  @IsObject()
  @IsOptional()
  permissions: Partial<Permissions>;

  @IsBoolean()
  @IsOptional()
  credentialCurationEnabled: boolean;

  @IsObject()
  @IsOptional()
  voting: Voting;

  @IsObject()
  @IsOptional()
  formMetadata: Partial<FormMetadata>;

  @IsObject()
  @IsOptional()
  projectMetadata: Partial<ProjectMetadata>;

  @IsObject()
  @IsOptional()
  data: MappedItem<object>;

  @IsObject()
  @IsOptional()
  archivedData: MappedItem<object>;

  @IsBoolean()
  @IsOptional()
  archived: boolean;

  @IsObject()
  @IsOptional()
  discordThreadRef: {
    [key: string]: {
      threadId: string;
      channelId: string;
      guildId: string;
      private: boolean;
    };
  };

  @IsObject()
  @IsOptional()
  collectionLevelDiscordThreadRef: {
    channelId: string;
    guildId: string;
    private: boolean;
    threadId?: string;
    messageId?: string;
  };
}

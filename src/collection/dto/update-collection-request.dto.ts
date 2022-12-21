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
import { ProjectMetadata } from '../model/collection.model';
import { OpportunityInfo, Permissions } from '../types/types';
import { Voting } from '../types/types';

export class UpdateCollectionDto {
  /**
   * The name collection
   */
  @IsString()
  @IsOptional()
  name?: string;
  /**
   * Private collection
   */
  @IsBoolean()
  @IsOptional()
  privateResponses: boolean;

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
}

interface FormMetadata {
  messageOnSubmission: string;
  multipleResponsesAllowed: boolean;
  updatingResponseAllowed: boolean;
  active: boolean;
  sendConfirmationEmail: boolean;
  logo: string;
  cover: string;
  sybilProtectionEnabled: boolean;
  sybilProtectionScores: { [id: string]: number };
  numOfKudos: number;
  isAnOpportunity: boolean;
  opportunityInfo: OpportunityInfo;
}

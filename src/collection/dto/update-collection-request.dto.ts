import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { GuildRole } from 'src/common/types/role.type';
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
   * The message to show when the form is submitted
   */
  @IsString()
  @IsOptional()
  messageOnSubmission: string;

  /**
   * Multiple responses by same user allowed?
   */
  @IsBoolean()
  @IsOptional()
  multipleResponsesAllowed: boolean;

  /**
   * Updating responses allowed?
   */
  @IsBoolean()
  @IsOptional()
  updatingResponseAllowed: boolean;

  /**
   * Send confirmation email upon submission?
   */
  @IsBoolean()
  @IsOptional()
  sendConfirmationEmail: boolean;

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
   * The message to show when the form is submitted
   */
  @IsString()
  @IsOptional()
  logo: string;

  /**
   * The message to show when the form is submitted
   */
  @IsString()
  @IsOptional()
  cover: string;

  /**
   * The updated property order
   */
  @IsArray()
  @IsOptional()
  propertyOrder: string[];

  @IsBoolean()
  @IsOptional()
  sybilProtectionEnabled: boolean;

  @IsObject()
  @IsOptional()
  sybilProtectionScores: { [id: string]: number };

  @IsNumber()
  @IsOptional()
  numOfKudos: number;

  @IsObject()
  @IsOptional()
  permissions: Partial<Permissions>;

  @IsBoolean()
  @IsOptional()
  credentialCurationEnabled: boolean;

  @IsBoolean()
  @IsOptional()
  isAnOpportunity: boolean;

  @IsObject()
  @IsOptional()
  opportunityInfo: OpportunityInfo;

  @IsObject()
  @IsOptional()
  voting: Voting;
}

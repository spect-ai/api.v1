import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { GuildRole } from 'src/common/types/role.type';

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
  circleRolesToEmailUponNewResponse: string[];

  /**
   * Send email to circle members upon updated response
   */
  @IsArray()
  @IsOptional()
  circleRolesToEmailUponUpdatedResponse: string[];
}

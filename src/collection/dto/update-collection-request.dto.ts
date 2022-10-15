import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

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
  formRoleGating: number[];

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
}

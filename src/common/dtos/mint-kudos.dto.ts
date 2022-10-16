import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { HasMimeType, IsFile } from 'nestjs-form-data';

export class MintKudosDto {
  /**
   * Creator of Kudos
   */
  @IsString()
  @IsNotEmpty()
  creator: string;
  /**
   * Kudos headline
   */
  @IsString()
  @IsOptional()
  headline: string;
  /**
   * Kudos headline
   */
  @IsString()
  @IsOptional()
  description: string;
  /**
   * Kudos headline
   */
  @IsNumber()
  @IsOptional()
  startDateTimestamp?: number;
  /**
   * Kudos headline
   */
  @IsNumber()
  @IsOptional()
  endDateTimestamp?: number;
  /**
   * Kudos headline
   */
  @IsArray()
  @IsOptional()
  links: string[];
  /**
   * Kudos headline
   */
  @IsString()
  @IsNotEmpty()
  communityId: string;

  /**
   * Kudos headline
   */
  @IsString()
  @IsOptional()
  nftTypeId?: string;
  /**
   * Kudos headline
   */
  @IsBoolean()
  @IsOptional()
  isSignatureRequired: boolean;

  /**
   * Kudos headline
   */
  @IsBoolean()
  @IsOptional()
  isAllowlistRequired?: boolean;

  /**
   * Array of contributors receiving kudos
   */
  @IsArray()
  @IsOptional()
  contributors: string[];

  /**
   * Total number of possible claims
   */
  @IsNumber()
  @IsOptional()
  totalClaimCount?: number;
  /**
   * Kudos expiration time
   */
  @IsNumber()
  @IsOptional()
  expirationTimestamp?: number;
  /**
   * Array of contributors receiving kudos
   */
  @IsArray()
  @IsOptional()
  customAttributes: object[];

  /**
   * Signature of person giving out kudos
   */
  @IsString()
  @IsNotEmpty()
  signature: string;
}

export class ClaimKudosDto {
  @IsString()
  @IsNotEmpty()
  claimingAddress: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsNumber()
  @IsNotEmpty()
  tokenId: number;
}

export class AddCustomImageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsFile()
  @IsNotEmpty()
  @HasMimeType([
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'video/mp4',
  ])
  assetFile: any;
}

export class KudosResponseDto {
  /**
   * Creator of Kudos
   */
  @IsNumber()
  @IsNotEmpty()
  tokenId: number;
  /**
   * Kudos headline
   */
  @IsString()
  @IsNotEmpty()
  headline: string;
  /**
   * Kudos headline
   */
  @IsString()
  @IsNotEmpty()
  description: string;
  /**
   * Kudos headline
   */
  @IsNumber()
  @IsOptional()
  startDateTimestamp?: number;
  /**
   * Kudos headline
   */
  @IsNumber()
  @IsOptional()
  endDateTimestamp?: number;
  /**
   * Kudos headline
   */
  @IsArray()
  @IsNotEmpty()
  links: string[];
  /**
   * Kudos headline
   */
  @IsString()
  @IsNotEmpty()
  communityId: string;

  /**
   * Kudos headline
   */
  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}

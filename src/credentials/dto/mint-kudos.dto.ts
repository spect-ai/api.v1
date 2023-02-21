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

  @IsString()
  @IsOptional()
  headline: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @IsOptional()
  startDateTimestamp?: number;

  @IsNumber()
  @IsOptional()
  endDateTimestamp?: number;

  @IsArray()
  @IsOptional()
  links: string[];

  @IsString()
  @IsNotEmpty()
  communityId: string;

  @IsString()
  nftTypeId?: string;

  @IsBoolean()
  @IsOptional()
  isSignatureRequired: boolean;

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

  @IsString()
  @IsNotEmpty()
  headline: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsOptional()
  startDateTimestamp?: number;

  @IsNumber()
  @IsOptional()
  endDateTimestamp?: number;

  @IsArray()
  @IsNotEmpty()
  links: string[];

  @IsString()
  @IsNotEmpty()
  communityId: string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}

export class PoapClaimDto {
  @IsString()
  @IsNotEmpty()
  claimCode: string;

  @IsString()
  @IsNotEmpty()
  editCode: string;

  @IsString()
  @IsNotEmpty()
  ethAddress: string;
}

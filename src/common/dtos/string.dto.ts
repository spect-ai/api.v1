import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
} from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class OffsetLimitDto {
  @IsNumber()
  @IsOptional()
  offset: number;

  @IsNumber()
  @IsOptional()
  limit: number;
}
export class RequiredSlugDto {
  /**
   * Object Id
   */
  @IsNotEmpty()
  @IsString()
  slug: string;
}

export class RequiredColumnIdDto {
  /**
   * Object Id
   */
  @IsNotEmpty()
  @IsString()
  columnId: string;
}

export class RequiredThreadIdDto {
  /**
   * Object Id
   */
  @IsNotEmpty()
  @IsString()
  threadId: string;
}

export class RequiredWorkUnitIdDto {
  /**
   * Object Id
   */
  @IsNotEmpty()
  @IsString()
  workUnitId: string;
}

export class RequiredCommitIdDto {
  /**
   * Object Id
   */
  @IsNotEmpty()
  @IsString()
  commitId: string;
}

export class RequiredViewIdDto {
  /**
   * Object Id
   */
  @IsNotEmpty()
  @IsString()
  viewId: string;
}

export class RequiredCardIdDto {
  /**
   * Object Id
   */
  @IsNotEmpty()
  @IsObjectId()
  cardId: string;
}

export class RequiredRoleDto {
  /**
   * role Id
   */
  @IsNotEmpty()
  @IsString()
  role: string;
}

export class RequiredAutomationIdDto {
  @IsNotEmpty()
  @IsString()
  automationId: string;
}

export class RequiredPaymentIdDto {
  @IsNotEmpty()
  @IsString()
  paymentId: string;
}

export class RequiredPropertyIdDto {
  @IsNotEmpty()
  @IsUUID()
  propertyId: string;
}

export class RequiredUUIDDto {
  @IsNotEmpty()
  @IsString()
  dataId: string;
}

export class RequiredActivityUUIDDto {
  @IsNotEmpty()
  @IsUUID()
  activityId: string;
}

export class OptionalArrayOfTags {
  @IsOptional()
  @IsString()
  term: string;
}

export class RequiredHandle {
  @IsNotEmpty()
  @IsString()
  handle: string;
}

export class RequiredExperienceId {
  @IsNotEmpty()
  @IsString()
  experienceId: string;
}

export class RequiredEducationId {
  @IsNotEmpty()
  @IsString()
  educationId: string;
}

export class RequiredUsernameDto {
  @IsNotEmpty()
  @IsString()
  username: string;
}

export class RequiredEthAddressDto extends OffsetLimitDto {
  @IsNotEmpty()
  @IsString()
  ethAddress: string;
}

export class RequiredIssuerDto {
  @IsNotEmpty()
  @IsString()
  issuer: string;
}
export class OptionalOffsetDto {
  @IsNumber()
  @IsOptional()
  offset: number;
}

export class OptionalLimitDto {
  @IsNumber()
  @IsOptional()
  limit: number;
}

export class RequiredPoapIdDto {
  @IsString()
  @IsNotEmpty()
  poapId: string;
}

export class RequiredDiscordMessageIdDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;
}

export class RequiredDiscordIdDto {
  @IsString()
  @IsNotEmpty()
  discordId: string;

  @IsString()
  @IsOptional()
  discordUsername: string;

  @IsString()
  @IsOptional()
  populateFields: string;
}

export class RequiredDiscordChannelIdDto {
  @IsString()
  @IsNotEmpty()
  channelId: string;
}
export class RequiredUrlDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

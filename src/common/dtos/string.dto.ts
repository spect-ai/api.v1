import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

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

export class RequiredPropertyIdDto {
  @IsNotEmpty()
  @IsString()
  propertyId: string;
}

export class RequiredUUIDDto {
  @IsNotEmpty()
  @IsUUID()
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

import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
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
  /**
   * role Id
   */
  @IsNotEmpty()
  @IsString()
  automationId: string;
}

export class RequiredPropertyIdDto {
  /**
   * role Id
   */
  @IsNotEmpty()
  @IsString()
  propertyId: string;
}

export class RequiredUUIDDto {
  /**
   * role Id
   */
  @IsNotEmpty()
  @IsUUID()
  id: string;
}

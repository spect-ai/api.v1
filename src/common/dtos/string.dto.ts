import { IsNotEmpty, IsString } from 'class-validator';

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
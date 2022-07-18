import { PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateCardRequestDto } from './create-card-request.dto';

export class CreateGithubPRDto {
  /**
   * Submission name
   */
  @IsString()
  @IsNotEmpty()
  name: string;
  /**
   * Submission content
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  content: string;

  /**
   * submission thread status
   */
  @IsString()
  @IsNotEmpty()
  status: 'inReview' | 'draft';

  /**
   * Submission PR if any
   */
  @IsString()
  @IsOptional()
  pr: string;

  /**
   * Submission PR if any
   */
  @IsArray()
  slugs: string[];
}

export class CreateWorkThreadRequestDto {
  /**
   * Submission name
   */
  @IsString()
  @IsNotEmpty()
  name: string;
  /**
   * Submission content
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  content: string;

  /**
   * submission thread status
   */
  @IsString()
  @IsNotEmpty()
  status: 'inReview' | 'draft';

  /**
   * Submission PR if any
   */
  @IsString()
  @IsOptional()
  pr: string;
}

export class UpdateWorkThreadRequestDto {
  /**
   * Submission name
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;
  /**
   * submission thread status
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  status: 'accepted' | 'inRevision' | 'inReview' | 'draft';

  /**
   * set submission to active or expired
   */
  @IsBoolean()
  @IsOptional()
  active: boolean;
}

export class CreateWorkUnitRequestDto {
  /**
   * Is the submission a revision instruction or a submission
   */
  @IsString()
  @IsNotEmpty()
  type: 'submission' | 'revision' | 'feedback';

  /**
   * Submission content
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  content: string;

  /**
   * Submission thread status
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  status: 'accepted' | 'inRevision' | 'inReview' | 'draft';

  /**
   * Submission PR if any
   */
  @IsString()
  @IsOptional()
  pr: string;
}

export class UpdateWorkUnitRequestDto {
  /**
   * Is the submission a revision instruction or a submission
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  type: 'submission' | 'revision' | 'feedback';

  /**
   * Submission content
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  content: string;

  /**
   * Submission thread status
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  status: 'accepted' | 'inRevision' | 'inReview' | 'draft';

  /**
   * Submission PR if any
   */
  @IsString()
  @IsOptional()
  pr: string;
}

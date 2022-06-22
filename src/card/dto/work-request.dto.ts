import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateCardRequestDto } from './create-card-request.dto';

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
  content: string;

  /**
   * Is the submission a revision instruction or a submission
   */
  @IsString()
  @IsNotEmpty()
  status: 'inReview' | 'draft';
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
   * Is the submission a revision instruction or a submission
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  status: 'accepted' | 'inRevision' | 'inReview' | 'draft';

  /**
   * Ask for a revision
   */
  @IsBoolean()
  @IsOptional()
  active: boolean;
}

export class CreateWorkUnitRequestDto {
  /**
   * Confirm submission and ask for review
   */
  @IsString()
  @IsNotEmpty()
  type: 'submission' | 'revision' | 'feedback';

  /**
   * Submission content
   */
  @IsString()
  @IsNotEmpty()
  content: string;

  /**
   * Is the submission a revision instruction or a submission
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  status: 'accepted' | 'inRevision' | 'inReview' | 'draft';
}

export class UpdateWorkUnitRequestDto extends PartialType(
  CreateWorkUnitRequestDto,
) {}

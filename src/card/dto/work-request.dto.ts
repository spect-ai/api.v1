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
   * submission thread status
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
  content: string;

  /**
   * Submission thread status
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  status: 'accepted' | 'inRevision' | 'inReview' | 'draft';
}

export class UpdateWorkUnitRequestDto extends PartialType(
  CreateWorkUnitRequestDto,
) {}

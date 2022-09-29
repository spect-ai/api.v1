import { OmitType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';
import { Status } from 'src/common/types/status.type';
import { CreateCardRequestDto } from './create-card-request.dto';

export class UpdateCardRequestDto extends OmitType(CreateCardRequestDto, [
  'title',
  'project',
  'circle',
  'columnId',
  'type',
  'childCards',
  'parent',
] as const) {
  /**
   * The title of the card
   */
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  title?: string;

  /**
   * The title of the card
   */
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  type?: 'Task' | 'Bounty';

  /**
   * The column Id of the card
   */
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  columnId?: string;

  /**
   * The index at which the card is located in the column
   */
  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  cardIndex?: number | 'end';

  /**
   * The statis of the card (active, inreview etc) - TODO: Add custom validation
   */
  @IsObject()
  @IsOptional()
  @IsNotEmpty()
  status?: Status;

  /**
   * Should this update also make the same updates to the child cards. This is
   * relevant when moving a card to a different column, status update, project update.
   */
  @IsBoolean()
  @IsOptional()
  updateChildCards?: boolean;

  /**
   * assigned circle
   */
  @IsObjectId()
  @IsOptional()
  assignedCircle?: string;
}

export class UpdateCardStatusRequestDto {
  /**
   * The status of the card (active, inreview etc) - TODO: Add custom validation
   */
  @IsObject()
  @IsOptional()
  @IsNotEmpty()
  status?: Status;
}

export class MultiCardCloseDto {
  /**
   * The status of the card (active, inreview etc) - TODO: Add custom validation
   */
  @IsArray()
  @IsNotEmpty()
  cardIds: string[];
}

export class MultiCardCloseWithSlugDto {
  /**
   * The status of the card (active, inreview etc) - TODO: Add custom validation
   */
  @IsArray()
  @IsNotEmpty()
  slugs: string[];
}

export class RecordKudosDto {
  /**
   * The status of the card (active, inreview etc) - TODO: Add custom validation
   */
  @IsString()
  @IsNotEmpty()
  for: 'assignee' | 'reviewer';

  @IsNumber()
  @IsNotEmpty()
  tokenId: number;

  @IsArray()
  @IsNotEmpty()
  contributors: string[];
}

export class RecordClaimInfoDto {
  /**
   * The status of the card (active, inreview etc) - TODO: Add custom validation
   */
  @IsString()
  @IsNotEmpty()
  for: 'assignee' | 'reviewer';

  @IsNumber()
  @IsNotEmpty()
  tokenId: number;
}

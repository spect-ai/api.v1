import { OmitType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
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

import { OmitType, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Date, ObjectId } from 'mongoose';
import { Payment } from 'src/common/models/payment.model';
import { CardStatus } from 'src/common/types/status.type';
import { CreateCardRequestDto } from './create-card-request.dto';

export class UpdateCardRequestDto extends OmitType(CreateCardRequestDto, [
  'title',
  'project',
  'circle',
  'columnId',
] as const) {
  /**
   * The title of the card
   */
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  title: string;

  /**
   * The column Id of the card
   */
  @IsString()
  @IsOptional()
  columnId?: string;

  /**
   * The statis of the card (active, inreview etc) - TODO: Add custom validation
   */
  @IsObject()
  @IsOptional()
  status?: CardStatus;
}

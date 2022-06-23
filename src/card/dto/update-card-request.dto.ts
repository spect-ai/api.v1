import { OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { Status } from 'src/common/types/status.type';
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
  @IsNotEmpty()
  columnId?: string;

  /**
   * The statis of the card (active, inreview etc) - TODO: Add custom validation
   */
  @IsObject()
  @IsOptional()
  @IsNotEmpty()
  status?: Status;
}

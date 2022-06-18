import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsString,
} from 'class-validator';
import { ColumnDetailsDto } from './column-details.dto';

export class UpdateColumnRequestDto {
  /**
   * The name of the column
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  /**
   * The name of the column
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  defaultCardType: 'Task' | 'Bounty';
}

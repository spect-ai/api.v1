import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsDate,
  IsArray,
  IsNumber,
} from 'class-validator';
import { ObjectId } from 'mongoose';
import { Payment } from 'src/common/models/payment.model';
import { ColumnDetailsDto } from 'src/project/dto/column-details.dto';

export class CardTemplateData {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  /**
   * The description of the circle
   */
  @IsObject()
  @IsOptional()
  reward?: Payment;

  /**
   * The description of the circle
   */
  @IsString()
  @IsOptional()
  type?: string;

  /**
   * The description of the circle
   */
  @IsDate()
  @IsOptional()
  deadline?: Date;

  /**
   * The description of the circle
   */
  @IsArray()
  @IsOptional()
  labels?: string[];

  /**
   * The description of the circle
   */
  @IsNumber()
  @IsOptional()
  priority?: number;

  /**
   * The description of the circle
   */
  @IsString()
  columnId?: string;
}

export abstract class CreateCardTemplateDto {
  /**
   * The name of the temolate
   */
  @IsString()
  @IsNotEmpty()
  name?: string;

  /**
   * The type of the temolate
   */
  @IsString()
  @IsNotEmpty()
  type: 'card';

  /**
   * The template data that will be populated when the template is used
   */
  @IsNotEmpty()
  @Type(() => CardTemplateData)
  data: CardTemplateData;

  /**
   * The circle the template was created in
   */
  @IsString()
  @IsOptional()
  circle?: ObjectId;

  /**
   * The project the template was created in
   */
  @IsString()
  @IsOptional()
  project?: ObjectId;

  /**
   * The template is globally accessible. If set to false, template is only accessible within a circle
   */
  @IsBoolean()
  @IsOptional()
  global?: boolean;
}

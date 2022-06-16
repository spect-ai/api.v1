import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { ObjectId, Date } from 'mongoose';
import { Payment } from 'src/common/models/payment.model';
import { Card } from '../model/card.model';

export class CreateCardRequestDto {
  /**
   * The name of the circle
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * The description of the circle
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * The description of the circle
   */
  @IsArray()
  @IsOptional()
  reviewer?: ObjectId[];

  /**
   * The description of the circle
   */
  @IsArray()
  @IsOptional()
  assignee?: ObjectId[];

  /**
   * The description of the circle
   */
  @IsString()
  project: ObjectId;

  /**
   * The circle Id that the card belongs to
   */
  @IsString()
  circle: ObjectId;

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

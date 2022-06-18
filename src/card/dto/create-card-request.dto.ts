import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ObjectId, Date } from 'mongoose';
import { Payment } from 'src/common/models/payment.model';

export class CreateCardRequestDto {
  /**
   * The title of the card
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * The description of the card
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * The reviewer of the card
   */
  @IsArray()
  @IsOptional()
  reviewer?: ObjectId[];

  /**
   * The assignee of the card
   */
  @IsArray()
  @IsOptional()
  assignee?: ObjectId[];

  /**
   * The car's project
   */
  @IsString()
  project: ObjectId;

  /**
   * The circle Id that the card belongs to
   */
  @IsString()
  circle: ObjectId;

  /**
   * Card reward
   */
  @IsObject()
  @IsOptional()
  reward?: Payment;

  /**
   * Card type
   */
  @IsString()
  @IsOptional()
  type: string;

  /**
   * Card Deadline
   */
  @IsDate()
  @IsOptional()
  deadline?: Date;

  /**
   * Card Labels
   */
  @IsArray()
  @IsOptional()
  labels?: string[];

  /**
   * Card priority
   */
  @IsNumber()
  @IsOptional()
  priority?: number;

  /**
   * The card's column id
   */
  @IsString()
  columnId: string;
}

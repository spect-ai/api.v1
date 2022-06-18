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

export class UpdateCardRequestDto {
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
   *  The reviewer of the card
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
   * The card's project
   */
  @IsString()
  project: ObjectId;

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
  type?: string;

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
   * The priority of the card
   */
  @IsNumber()
  @IsOptional()
  priority?: number;

  /**
   * The column Id of the card
   */
  @IsString()
  @IsOptional()
  columnId?: string;

  /**
   * The description of the circle
   */
  @IsString()
  @IsOptional()
  status?: CardStatus;
}

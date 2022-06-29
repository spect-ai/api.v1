import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';
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
  reviewer?: string[];

  /**
   * The assignee of the card
   */
  @IsArray()
  @IsOptional()
  assignee?: string[];

  /**
   * The card's project
   */
  @IsObjectId()
  project: string;

  /**
   * The circle Id that the card belongs to
   */
  @IsObjectId()
  circle: string;

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
  @IsDateString()
  @IsOptional()
  deadline?: string;

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

  /**
   * The card's parents
   */
  @IsObjectId()
  @IsOptional()
  parent?: string;

  /**
   * The card's children
   */
  @IsArray()
  @IsOptional()
  childCards?: CreateCardRequestDto[];
}

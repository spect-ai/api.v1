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
import { Payment } from 'src/common/models/payment.model';
import { Properties, Property } from '../types/types';

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
  type: 'Task' | 'Bounty';

  /**
   * Card Deadline
   */
  @IsDateString()
  @IsOptional()
  deadline?: string;

  /**
   * Card Start Date
   */
  @IsDateString()
  @IsOptional()
  startDate?: string;

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
  @IsOptional()
  columnId: string;

  /**
   * The card's parents
   */
  @IsObjectId()
  @IsOptional()
  parent?: string;

  /**
   * The card's properties
   */
  @IsArray()
  @IsOptional()
  propertyOrder?: string[];

  /**
   * The card's properties
   */
  @IsObject()
  @IsOptional()
  properties?: Properties;

  /**
   * The card's children
   */
  @IsArray()
  @IsOptional()
  childCards?: CreateCardRequestDto[];
}

import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
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
import { Status } from 'src/common/types/status.type';
import { ApplicationDetails, ApplicationUnit } from '../model/application.type';
import { Card } from '../model/card.model';

export class DetailedCardResponseDto {
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
   * The title of the card
   */
  @IsString()
  @IsNotEmpty()
  slug: string;

  /**
   * The reviewers of the card
   */
  @IsArray()
  @IsOptional()
  reviewer?: string[];

  /**
   * The assignees of the card
   */
  @IsArray()
  @IsOptional()
  assignee?: string[];

  /**
   * The project of the card
   */
  @IsString()
  project: string;

  /**
   * The reward of the card
   */
  @IsObject()
  @IsOptional()
  reward?: Payment;

  /**
   * The type of the card
   */
  @IsString()
  @IsOptional()
  type?: string;

  /**
   * The deadline of the card
   */
  @IsDateString()
  @IsOptional()
  deadline?: string;

  /**
   * The labels of the card
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
   * The columnId of the card
   */
  @IsString()
  columnId?: string;

  /**
   * The status of the card
   */
  @IsObject()
  status?: Status;

  /**
   * The application of the caller
   */
  @IsObject()
  myApplication?: ApplicationUnit;
}

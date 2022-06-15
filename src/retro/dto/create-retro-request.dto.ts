import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Date, ObjectId } from 'mongoose';
import { Payment } from 'src/common/models/payment.model';

export class CreateRetroRequestDto {
  /**
   * The title associated with the retro period
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * The description of the retro period
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * The circle that the retro belongs to
   */
  @IsString()
  circleId: ObjectId;

  /**
   * The strategy used in the retro period, ie, Quadratic or Normal Voting
   */
  @IsString()
  @IsOptional()
  strategy?: string;

  /**
   * The start time of the retro period
   */
  @IsDate()
  @IsOptional()
  startTime?: Date;

  /**
   * The duration of the retro period
   */
  @IsNumber()
  @IsOptional()
  duration?: number;
  /**
   * The reward budget of the retro period
   */
  @IsObject()
  @IsOptional()
  reward?: Payment;
}

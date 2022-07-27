import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Date } from 'mongoose';
import { Payment } from 'src/common/models/payment.model';
import { Feedback, MappedStats } from '../types';
export class DetailedRetroResponseDto {
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
   * The slug associated with the retro period
   */
  @IsString()
  @IsNotEmpty()
  slug: string;

  /**
   * The creator of the retro period
   */
  @IsString()
  creator: string;

  /**
   * The cicle the retro belongs to
   */
  @IsString()
  circle: string;

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
   * The duration of the retro period
   */
  @IsDate()
  @IsOptional()
  endTime?: Date;

  /**
   * The reward budget of the retro period
   */
  @IsObject()
  @IsOptional()
  reward?: Payment;

  /**
   * The voting stats of different users
   */
  @IsObject()
  @IsOptional()
  stats: MappedStats;

  /**
   * The feedbacks given by user
   */
  @IsObject()
  @IsOptional()
  feedbackGiven: Feedback;

  /**
   * The activity history of the retro period
   */
  @IsObject()
  members: string[];
}

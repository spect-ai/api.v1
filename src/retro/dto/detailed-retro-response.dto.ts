import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Date } from 'mongoose';
import { ActivityModel } from 'src/common/models/activity.model';
import { FeedbackModel } from 'src/common/models/feedback.model';
import { Payment } from 'src/common/models/payment.model';
import { Stats, StatsModel } from '../models/stats.model';

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
  stats: Stats;

  /**
   * The feedbacks exchanged during the retro period
   */
  @IsObject()
  @IsOptional()
  feedbacks: FeedbackModel[];

  /**
   * The activity history of the retro period
   */
  @IsObject()
  @IsOptional()
  activity: ActivityModel[];
}

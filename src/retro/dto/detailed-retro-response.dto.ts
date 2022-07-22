import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Date } from 'mongoose';
import { Activity } from 'src/common/types/activity.type';
import { Payment } from 'src/common/models/payment.model';
import {
  FeedbackGiven,
  FeedbackReceived,
  IndexedFeedback,
  MappedStats,
} from '../types';
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
  stats: MappedStats;

  /**
   * The feedbacks exchanged during the retro period
   */
  @IsObject()
  @IsOptional()
  feedbacks: IndexedFeedback;

  /**
   * The feedbacks given by user
   */
  @IsObject()
  @IsOptional()
  feedbacksGiven: FeedbackGiven;

  /**
   * The feedbacks received by user
   */
  @IsObject()
  @IsOptional()
  feedbacksReceived: FeedbackReceived;

  /**
   * The activity history of the retro period
   */
  @IsObject()
  @IsOptional()
  activity: Activity[];
}

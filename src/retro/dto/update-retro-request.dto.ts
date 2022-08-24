import {
  IsDate,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Date } from 'mongoose';
import { Payment } from 'src/common/models/payment.model';
import { Status } from 'src/common/types/status.type';

export class UpdateRetroRequestDto {
  /**
   * The title associated with the retro period
   */
  @IsString()
  @IsOptional()
  title?: string;

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
   * The reward budget of the retro period
   */
  @IsObject()
  @IsOptional()
  reward?: Payment;

  /**
   * The status of the retro period
   */
  @IsObject()
  @IsOptional()
  status?: Status;
}

export class UpdateVoteRequestDto {
  /**
   * The member who's part of the retro period
   */
  @IsObject()
  votes: { [key: string]: number };
}

export class UpdatePaymentRequestDto {
  /**
   * The member who's part of the retro period
   */
  @IsString()
  transactionHash: string;
}

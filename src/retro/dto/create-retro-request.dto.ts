import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';
import { Date, ObjectId } from 'mongoose';
import { Payment } from 'src/common/models/payment.model';

export class MemberStats {
  @IsString()
  @IsNotEmpty()
  member: string;

  /**
   * Can the member vote in the retro?
   */
  @IsBoolean()
  canGive: boolean;

  /**
   * Can the member receive votes in the retro?
   */
  @IsBoolean()
  canReceive: boolean;

  /**
   * The votes allocated to the member
   */
  @IsNumber()
  allocation: number;
}

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
  @IsObjectId()
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
  @IsDateString()
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
   * The reward budget of the retro period
   */
  @IsArray()
  @IsOptional()
  memberStats?: MemberStats[];
}

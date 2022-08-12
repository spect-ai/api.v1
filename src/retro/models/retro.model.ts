import { prop } from '@typegoose/typegoose';
import { Date, Schema } from 'mongoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Circle } from 'src/circle/model/circle.model';
import { Payment } from 'src/common/models/payment.model';
import { User } from 'src/users/model/users.model';
import { Status } from '../../common/types/status.type';
import { Feedback, MappedStats } from '../types';

@useMongoosePlugin()
export class Retro extends BaseModel {
  /**
   * The title associated with the retro period
   */
  @prop({ required: true })
  title: string;

  /**
   * The slug associated with the retro period
   */
  @prop({ required: true })
  slug: string;

  /**
   * The description of the retro period
   */
  @prop()
  description: string;

  /**
   * The circle that the retro belongs to
   */
  @prop({ ref: () => Circle, required: true })
  circle: string;

  /**
   * The creator of the retro period
   */
  @prop({ ref: () => User, required: true })
  creator: string;

  /**
   * The status of the retro period
   */
  @prop({
    default: {
      active: true,
      paid: false,
      archived: false,
    },
  })
  status: Status;

  /**
   * The strategy used in the retro period, ie, Quadratic or Normal Voting
   */
  @prop({ default: 'Normal Voting' })
  strategy: string;

  /**
   * The start time of the retro period
   */
  @prop()
  startTime: Date;

  /**
   * The duration of the retro period
   */
  @prop()
  duration: number;

  /**
   * The end time of the retro period
   */
  @prop()
  endTime: Date;

  /**
   * The reward budget of the retro period
   */
  @prop({ required: true })
  reward: Payment;

  /**
   * The voting stats of different users
   */
  @prop({ required: true })
  stats: MappedStats;

  /**
   * The feedbacks exchanged during the retro period
   */
  @prop({ default: {} })
  feedbackGiven: Feedback;

  /**
   * The members part of the retro period
   */
  @prop({ ref: () => User, type: Schema.Types.String, required: true })
  members: string[];

  /**
   * The distribution of votes among the members
   */
  @prop({ default: {} })
  distribution: { [key: string]: number };
}

import { plugin, prop, Ref } from '@typegoose/typegoose';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { BaseModel } from 'src/base/base.model';
import { Payment } from 'src/common/models/payment.model';
import { Date, ObjectId } from 'mongoose';
import { ActivityModel } from 'src/common/models/activity.model';
import { User } from 'src/users/model/users.model';
import { RetroStatus } from '../../common/types/status.type';
import { Circle } from 'src/circle/model/circle.model';
import { FeedbackModel } from 'src/common/models/feedback.model';
import { Stats, StatsModel } from './stats.model';

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
  circle: ObjectId;

  /**
   * The creator of the retro period
   */
  @prop({ ref: () => User })
  creator: ObjectId;

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
  status: RetroStatus;

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
  stats: Stats;

  /**
   * The feedbacks exchanged during the retro period
   */
  @prop({ default: [] })
  feedbacks: FeedbackModel[];

  /**
   * The activity history of the retro period
   */
  @prop({ default: [] })
  activity: ActivityModel[];
}

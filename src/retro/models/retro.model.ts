import { plugin, prop, Ref } from '@typegoose/typegoose';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { BaseModel } from 'src/base/base.model';
import { Project } from 'src/project/model/project.model';
import { PaymentModel } from 'src/common/models/payment.model';
import { Date } from 'mongoose';
import { ActivityModel } from 'src/common/models/activity.model';
import { User } from 'src/users/model/users.model';
import { StatusModel } from 'src/common/models/status.model';
import { Circle } from 'src/circles/model/circle.model';
import { FeedbackModel } from 'src/common/models/feedback.model';
import { StatsModel } from './stats.model';

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
  @prop({ required: true })
  parent: Ref<Circle>;

  /**
   * The creator of the retro period
   */
  @prop({ required: true })
  creator: Ref<User>;

  /**
   * The status of the retro period
   */
  @prop({ required: true })
  status: StatusModel;

  /**
   * The strategy used in the retro period, ie, Quadratic or Normal Voting
   */
  @prop({ required: true })
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
  duration: Date;

  /**
   * The end time of the retro period
   */
  @prop()
  endTime: Date;

  /**
   * The reward budget of the retro period
   */
  @prop({ required: true })
  reward: PaymentModel;

  /**
   * The voting stats of different users
   */
  @prop({ required: true })
  stats: StatsModel;

  /**
   * The feedbacks exchanged during the retro period
   */
  @prop({ default: [] })
  feedbacks: FeedbackModel;

  /**
   * The activity history of the retro period
   */
  @prop({ default: [] })
  activity: ActivityModel;
}

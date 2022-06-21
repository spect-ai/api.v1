import { plugin, prop, Ref } from '@typegoose/typegoose';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { BaseModel } from 'src/base/base.model';
import { Project } from 'src/project/model/project.model';
import { Payment } from 'src/common/models/payment.model';
import { Date, ObjectId } from 'mongoose';
import mongoose from 'mongoose';
import { Activity } from 'src/common/types/activity.type';
import { CardStatus } from '../../common/types/status.type';
import { WorkThread, WorkThreads } from './workHistory.model';
import { User } from 'src/users/model/users.model';
import { Circle } from 'src/circle/model/circle.model';

@useMongoosePlugin()
export class Card extends BaseModel {
  /**
   * The title of the card
   */
  @prop({ required: true })
  title: string;

  /**
   * The slug associated with the card
   */
  @prop({ required: true })
  slug: string;

  /**
   * The description of the card
   */
  @prop()
  description: string;

  /**
   * The id of the creator of the card
   */
  @prop()
  creator: string;

  /**
   * The ids of all the reviewers of the card
   */
  @prop({ default: [] })
  reviewer: string[];

  /**
   * The ids of all the assignees of the card
   */
  @prop({ default: [] })
  assignee: string[];

  /**
   * The project that the card belongs to
   */
  @prop({ ref: () => Project, required: true })
  project: ObjectId;

  /**
   * The project that the card belongs to
   */
  @prop({ ref: () => Circle, required: true })
  circle: ObjectId;

  /**
   * The reward associated with the card
   */
  @prop({ required: true })
  reward: Payment;

  /**
   * The type of the card, i.e., task, bounty, etc.
   */
  @prop({ default: 'Task' })
  type: string;

  /**
   * The deadline the card is due to be completed by
   */
  @prop({ default: null })
  deadline?: string;
  /**
   * The labels associated with the card
   */
  @prop({ default: [] })
  labels: string[];

  /**
   * The priority of the card
   */
  @prop()
  priority: number;

  /**
   * The votes given to the card
   */
  @prop()
  votes: number;

  /**
   * The column that the card belongs to
   */
  @prop({ required: true })
  columnId: string;

  /**
   * The activity associated with the card
   */
  @prop({ default: [] })
  activity: Activity[];

  /**
   * The status of the card
   */
  @prop({
    default: {
      active: true,
      paid: false,
      archived: false,
      inReview: false,
      inRevision: false,
    },
  })
  status: CardStatus;

  /**
   * The history of work done on the card, supports multiple parallel work histories so
   * multiple people can work on the same card (relevant for contests, cooperatives etc)
   */
  @prop({ default: {} })
  workThreads: WorkThreads;

  /**
   * The order of the work threads
   */
  @prop({ default: [] })
  workThreadOrder: string[];
}

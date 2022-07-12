import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Circle } from 'src/circle/model/circle.model';
import { Payment } from 'src/common/models/payment.model';
import { Activity } from 'src/common/types/activity.type';
import { Project } from 'src/project/model/project.model';
import { Status } from '../../common/types/status.type';
import { ApplicationDetails } from '../types/types';
import { WorkThreads } from './workHistory.type';

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
  @prop({ required: true, unique: true })
  slug: string;

  /**
   * The description of the card
   */
  @prop()
  description?: string;

  /**
   * The id of the creator of the card
   */
  @prop()
  creator: string;

  /**
   * The ids of all the reviewers of the card
   */
  @prop({ default: [] })
  reviewer?: string[];

  /**
   * The ids of all the assignees of the card
   */
  @prop({ default: [] })
  assignee?: string[];

  /**
   * The project that the card belongs to
   */
  @prop({ ref: () => Project, required: true })
  project: string | Project;

  /**
   * The project that the card belongs to
   */
  @prop({ ref: () => Circle, required: true })
  circle: string;

  /**
   * The reward associated with the card
   */
  @prop({ required: true })
  reward: Payment;

  /**
   * The type of the card, i.e., task, bounty, etc.
   */
  @prop({ default: 'Task' })
  type: 'Task' | 'Bounty';

  /**
   * The deadline the card is due to be completed by
   */
  @prop({ default: null })
  deadline?: string;
  /**
   * The labels associated with the card
   */
  @prop({ default: [] })
  labels?: string[];

  /**
   * The priority of the card
   */
  @prop({ default: 0 })
  priority?: number;

  /**
   * The votes given to the card
   */
  @prop()
  votes?: number;

  /**
   * The column that the card belongs to
   */
  @prop({ required: true })
  columnId: string;

  /**
   * The activity associated with the card
   */
  @prop({ default: [] })
  activity?: Activity[];

  /**
   * The status of the card
   */
  @prop({
    default: {
      active: true,
      archived: false,
      paid: false,
    },
  })
  status?: Status;

  /**
   * The history of work done on the card, supports multiple parallel work histories so
   * multiple people can work on the same card (relevant for contests, cooperatives etc)
   */
  @prop({ default: {} })
  workThreads?: WorkThreads;

  /**
   * The order of the work threads
   */
  @prop({ default: [] })
  workThreadOrder?: string[];

  /**
   * The applications submitted to a bounty
   */
  @prop({ default: {} })
  application?: ApplicationDetails;

  /**
   * The order in which applications are saved
   */
  @prop({ default: [] })
  applicationOrder?: string[];

  /**
   * The child cards associated with the card
   */
  @prop({ ref: () => Card, default: [] })
  children?: string[];

  /**
   * The parent card associated with the card
   */
  @prop({ ref: () => Card })
  parent?: string;
}

export class ExtendedCard extends Card {
  flattenedChildren?: Card[];
}

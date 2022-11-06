import { prop } from '@typegoose/typegoose';
import { Schema } from 'mongoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Circle } from 'src/circle/model/circle.model';
import { MappedItem } from 'src/common/interfaces';
import { GuildRole } from 'src/common/types/role.type';
import {
  Activity,
  DefaultViewType,
  OpportunityInfo,
  Property,
} from '../types/types';

@useMongoosePlugin()
export class Collection extends BaseModel {
  /**
   * The name of the collection
   */
  @prop({ required: true })
  name: string;
  /**
   * The unique slug of the collection
   */
  @prop({ required: true })
  slug: string;
  /**
   * Is collection private?
   */
  @prop({ default: true })
  privateResponses: boolean;
  /**
   * The description of the collection
   */
  @prop()
  description: string;

  /**
   * Properties in the collection
   */
  @prop()
  properties: MappedItem<Property>;

  /**
   * Properties in the collection
   */
  @prop({ default: [] })
  propertyOrder: string[];

  /**
   * The description of the collection
   */
  @prop({ required: true })
  creator: string;

  /**
   * Parent Ids of the collection
   */
  @prop({ ref: () => Circle, type: Schema.Types.String, default: [] })
  parents: string[];

  /**
   * The data contained in the collection
   */
  @prop({ default: {} })
  data: MappedItem<object>;

  /**
   * All the activities in all the data streams - { dataSlug : { activityId: ActivityObject  } }
   */
  @prop({ default: {} })
  dataActivities: MappedItem<MappedItem<Activity>>;

  /**
   * All the activity orders in all the data streams
   */
  @prop({ default: {} })
  dataActivityOrder: MappedItem<string[]>;

  /**
   * The owner of the data
   */
  @prop({ default: {} })
  dataOwner: MappedItem<string>;

  /**
   * The data indexed by different fields
   */
  @prop({ default: {} })
  indexes: MappedItem<string[]>;

  /**
   * The default view of the collection
   */
  @prop({ default: 'table' })
  defaultView: DefaultViewType;

  /**
   * The guild.xyz roles that a person needs to hold to fill up form
   */
  @prop({ default: [] })
  formRoleGating: GuildRole[];

  /**
   * The mintkudos token id to distribute when a person fills the form
   */
  @prop()
  mintkudosTokenId: number;

  /**
   * The addresses that have already claimed mintkudos for submitting form
   */
  @prop({ default: [] })
  mintkudosClaimedBy: string[];

  /**
   * The message to show when the form is submitted
   */
  @prop({ default: 'Thanks for your response!' })
  messageOnSubmission: string;

  /**
   * Multiple responses by same user allowed?
   */
  @prop({ default: true })
  multipleResponsesAllowed: boolean;

  /**
   * Updating responses allowed?
   */
  @prop({ default: true })
  updatingResponseAllowed: boolean;

  /**
   * Send confirmation email upon submission?
   */
  @prop({ default: false })
  sendConfirmationEmail: boolean;

  /**
   * Send email to circle members upon new response
   */
  @prop({ default: [] })
  circleRolesToNotifyUponNewResponse: string[];

  /**
   * Send email to circle members upon updated response
   */
  @prop({ default: [] })
  circleRolesToNotifyUponUpdatedResponse: string[];

  /**
   * The message to show when the form is submitted
   */
  @prop({ default: '' })
  logo: string;

  /**
   * The message to show when the form is submitted
   */
  @prop({ default: '' })
  cover: string;

  @prop({ default: false })
  sybilProtectionEnabled: boolean;

  @prop()
  sybilProtectionScores: { [id: string]: number };

  @prop()
  numOfKudos: number;

  @prop({ default: false })
  credentialCurationEnabled: boolean;

  @prop({ default: false })
  isAnOpportunity: boolean;

  @prop()
  opportunityInfo: OpportunityInfo;
}

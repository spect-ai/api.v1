import { prop } from '@typegoose/typegoose';
import { ProfileModel } from 'src/common/models/profile.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Schema } from 'mongoose';
import { Circle } from 'src/circle/model/circle.model';
import {
  Activity,
  FormResponses,
  LensEducation,
  LensExperience,
  LensSkills,
  Notification,
  NotificationV2,
  UserSubmittedApplication,
} from '../types/types';
import { Collection } from 'src/collection/model/collection.model';

@useMongoosePlugin()
export class User extends ProfileModel {
  /**
   * username
   */
  @prop({ required: true })
  username: string;

  /**
   * The description of the profile
   */
  @prop({ default: '' })
  bio: string;

  /**
   * The skills of the profile
   */
  @prop({ default: [] })
  skills: string[];

  /**
   * Ethereum address
   */
  @prop({ required: true })
  ethAddress: string;

  /**
   * Avatar
   */
  @prop()
  avatar: string;

  /**
   * List of accounts connected to this user
   */
  @prop()
  accounts: string[];

  /**
   * Discord Integration user id
   */
  @prop()
  discordId: string;

  /**
   * Discord Integration user name
   */
  @prop()
  discordUsername: string;

  /**
   * Email of user
   */
  @prop()
  email: string;

  /**
   * Github Integration user id
   */
  @prop()
  githubId: string;

  /**
   * List of circles this user is a member of, this will contain both parent and child circles
   */
  @prop({ ref: () => Circle, type: Schema.Types.String, default: [] })
  circles: string[];

  /**
   * List of collections created by the user
   */
  @prop({ ref: () => Collection, type: Schema.Types.String, default: [] })
  collections: string[];

  /**
   * List of forms responded to by the user
   */
  @prop({ ref: () => Collection, type: Schema.Types.String, default: [] })
  collectionsSubmittedTo: string[];

  /**
   * Activities taken by the user
   */
  @prop({ default: [] })
  activities: Activity[];

  /**
   * Notifications for the user
   */
  @prop({ default: [] })
  notifications: Notification[];

  /**
   * Notifications for the user
   */
  @prop({ default: [] })
  notificationsV2: NotificationV2[];

  /**
   * Applications submitted by the user
   */
  @prop({ default: [] })
  activeApplications: UserSubmittedApplication[];

  /**
   * Applications submitted by the user that have been picked
   */
  @prop({ default: [] })
  pickedApplications: UserSubmittedApplication[];

  /**
   * Applications submitted by the user that have been rejected
   */
  @prop({ default: [] })
  rejectedApplications: UserSubmittedApplication[];

  /**
   * Circles followed by the user
   */
  @prop({ ref: () => Circle, type: Schema.Types.String, default: [] })
  followedCircles: string[];

  /**
   * Users followed by the user
   */
  @prop({ ref: () => User, type: Schema.Types.String, default: [] })
  followedUsers: string[];

  /**
   * Users following the user
   */
  @prop({ ref: () => User, type: Schema.Types.String, default: [] })
  followedByUsers: string[];

  @prop({ default: [] })
  experiences?: LensExperience[];

  /**
   * Educations of user
   */
  @prop({ default: [] })
  education?: LensEducation[];

  /**
   * The skills of the profile
   */
  @prop({ default: [] })
  skillsV2: LensSkills[];

  @prop()
  lensHandle?: string;
}

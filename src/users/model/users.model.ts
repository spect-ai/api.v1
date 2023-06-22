import { prop } from '@typegoose/typegoose';
import { Schema } from 'mongoose';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Circle } from 'src/circle/model/circle.model';
import { Collection } from 'src/collection/model/collection.model';
import { ProfileModel } from 'src/common/models/profile.model';
import { Activity, NotificationV2 } from '../types/types';

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
   * Discord Integration avatar
   */
  @prop()
  discordAvatar: string;

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
   * Github Integration user id
   */
  @prop()
  githubUsername: string;

  /**
   * Github Integration user id
   */
  @prop()
  githubAvatar: string;

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

  @prop()
  telegram?: {
    id: string;
    username: string;
  };

  @prop()
  apiKeys?: string[];
}

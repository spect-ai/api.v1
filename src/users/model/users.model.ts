import { prop } from '@typegoose/typegoose';
import { ProfileModel } from 'src/common/models/profile.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { ObjectId } from 'mongoose';
import { Circle } from 'src/circle/model/circle.model';
import { Card } from 'src/card/model/card.model';
import { Project } from 'src/project/model/project.model';
import { Activity, Notification } from '../types/types';

@useMongoosePlugin()
export class User extends ProfileModel {
  /**
   * username
   */
  @prop({ required: true })
  username: string;

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
   * Github Integration user id
   */
  @prop()
  githubId: string;

  /**
   * List of circles this user is a member of, these will also contain circles that the user was historically a member of
   * as removal from a circle will not be reflected in the user's circles.
   */
  @prop({ ref: () => Circle, default: [] })
  circles: string[];

  /**
   * List of cards a user is currently assigned to
   */
  @prop({ ref: () => Card, default: [] })
  assignedCards: string[];

  /**
   * List of cards a user is currently reviewing
   */
  @prop({ ref: () => Card, default: [] })
  reviewingCards: string[];

  /**
   * List of cards a user was assigned to that have been closed
   */
  @prop({ ref: () => Card, default: [] })
  assignedClosedCards: string[];

  /**
   * List of cards a user was reviewing that have been closed
   */
  @prop({ ref: () => Card, default: [] })
  reviewingClosedCards: string[];

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
   * Card bookmarks for the user
   */
  @prop({ ref: () => Card, default: [] })
  bookmarks: string[];

  /**
   * Circles followed by the user
   */
  @prop({ ref: () => Circle, default: [] })
  followedCircles: string[];

  /**
   * Users followed by the user
   */
  @prop({ default: [] })
  followedUsers: string[];

  /**
   * Users following the user
   */
  @prop({ default: [] })
  followedByUsers: string[];
}

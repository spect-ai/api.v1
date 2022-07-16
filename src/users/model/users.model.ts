import { prop } from '@typegoose/typegoose';
import { ProfileModel } from 'src/common/models/profile.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { ObjectId } from 'mongoose';
import { Circle } from 'src/circle/model/circle.model';

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
  @prop(() => Circle)
  circles: string[];

  /**
   * List of projects a user is assigned or reviewing
   */
  @prop(() => Circle)
  projects: string[];

  /**
   * List of cards a user is assigned or reviewing
   */
  @prop(() => Circle)
  cards: string[];

  /**
   * Activities taken by the user
   */
  activities: string[];

  /**
   * Notifications for the user
   */
  @prop()
  notifications: string[];
}

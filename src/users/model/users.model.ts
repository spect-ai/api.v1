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
}

import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

@useMongoosePlugin()
export class User extends BaseModel {
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
   * Email
   */
  @prop()
  email: string;

  /**
   * Profile picture stored in IPFS as URL
   */
  @prop()
  avatar: string;

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

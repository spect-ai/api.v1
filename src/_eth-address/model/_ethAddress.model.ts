import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { User } from 'src/users/model/users.model';

@useMongoosePlugin()
export class _EthAddress extends BaseModel {
  /**
   * The eth address of the account
   */
  @prop({ required: true })
  ethAddress: string;

  /**
   * Signature signed
   */
  @prop()
  signature: string;

  /**
   * Some custom data
   */
  @prop()
  data: string;

  /**
   * Linked User
   */
  @prop()
  user: User;
}

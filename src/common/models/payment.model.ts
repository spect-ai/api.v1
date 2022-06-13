import { prop } from '@typegoose/typegoose';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { ChainModel } from './chain.model';
import { TokenModel } from './token.model';

export abstract class PaymentModel {
  /**
   * The description of the profile
   */
  @prop()
  chain?: ChainModel;

  /**
   * The description of the profile
   */
  @prop()
  token?: TokenModel;

  /**
   * The website associated with the profile
   */
  @prop({ default: 0 })
  value?: number;
}

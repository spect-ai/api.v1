import { prop } from '@typegoose/typegoose';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { ChainModel } from './chain.model';
import { TokenModel } from './token.model';

export abstract class PaymentModel {
  /**
   * The network used for payment
   */
  @prop()
  chain?: ChainModel;

  /**
   * The token used for payment
   */
  @prop()
  token?: TokenModel;

  /**
   * The value of the payment
   */
  @prop({ default: 0 })
  value?: number;

  /**
   * The transaction hash of payment
   */
  @prop()
  transactionHash?: string;
}

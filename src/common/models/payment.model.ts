import { prop } from '@typegoose/typegoose';
import { Chain } from './chain.model';
import { Token } from './token.model';

export abstract class PaymentModel {
  /**
   * The network used for payment
   */
  @prop()
  chain?: Chain;

  /**
   * The token used for payment
   */
  @prop()
  token?: Token;

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

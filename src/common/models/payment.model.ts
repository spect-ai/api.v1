import { prop } from '@typegoose/typegoose';
import { Chain } from './chain.model';
import { Token } from './token.model';

export type Payment = {
  /**
   * The network used for payment
   */
  chain?: Chain;

  /**
   * The token used for payment
   */
  token?: Token;

  /**
   * The value of the payment
   */
  value?: number;

  /**
   * The transaction hash of payment
   */
  transactionHash?: string;
};

import { prop } from '@typegoose/typegoose';

export type Chain = {
  /**
   * The chainId of the chain
   */
  chainId?: string;

  /**
   * The name of the chain
   */
  name?: string;
};

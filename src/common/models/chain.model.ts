import { prop } from '@typegoose/typegoose';

export abstract class ChainModel {
  /**
   * The chainId of the chain
   */
  @prop()
  chainId?: string;

  /**
   * The name of the chain
   */
  @prop()
  name?: string;
}

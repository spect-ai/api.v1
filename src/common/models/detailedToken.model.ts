import { prop } from '@typegoose/typegoose';
import { TokenModel } from './token.model';

export class DetailedTokenModel extends TokenModel {
  /**
   * The chainId of the chain
   */
  @prop()
  name?: string;
}

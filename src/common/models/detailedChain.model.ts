import { prop } from '@typegoose/typegoose';
import { ChainModel } from 'src/common/models/chain.model';
import { DetailedTokenModel } from './detailedToken.model';

export class DetailedChainModel extends ChainModel {
  /**
   * Address of the distributor contract
   */
  @prop()
  distributorAddress: string;

  /**
   * Address of the tokens available on the chain
   */
  @prop()
  tokens: DetailedTokenModel[];

  /**
   * Network is mainnet or testnet
   */
  @prop({ required: true })
  mainnet: boolean;

  /**
   * Avatar associated with network
   */
  @prop({ required: true })
  avatar: string;

  /**
   * Native currency symbol of network
   */
  @prop({ required: true })
  nativeCurrency: string;

  /**
   * Block explorer of network
   */
  @prop({ required: true })
  blockExplorer: string;

  /**
   * Custom provider that can be used to query the blockchain
   */
  @prop()
  customProvider: string;
}

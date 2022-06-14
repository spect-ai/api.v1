import { DetailedToken } from './detailedToken.model';

export type DetailedChain = {
  /**
   * The chainId of the chain
   */
  chainId?: string;

  /**
   * The name of the chain
   */
  name?: string;
  /**
   * Address of the distributor contract
   */
  distributorAddress: string;

  /**
   * Address of the tokens available on the chain
   */
  tokens: DetailedToken[];

  /**
   * Network is mainnet or testnet
   */
  mainnet: boolean;

  /**
   * Avatar associated with network
   */
  avatar: string;

  /**
   * Native currency symbol of network
   */
  nativeCurrency: string;

  /**
   * Block explorer of network
   */
  blockExplorer: string;

  /**
   * Custom provider that can be used to query the blockchain
   */
  customProvider: string;
};

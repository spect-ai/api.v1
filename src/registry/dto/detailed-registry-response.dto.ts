import { IsNotEmpty, IsObject } from 'class-validator';
import { TokenDetails, TokenInfo } from '../model/registry.model';

export type NetworkInfo = {
  chainId: string;

  name: string;

  distributorAddress: string;

  mainnet: boolean;

  nativeCurrency: string;

  pictureUrl: string;

  blockExplorer: string;

  provider: string;

  tokenDetails: TokenDetails;
};

export type RegistryObjectified = {
  [chainId: string]: NetworkInfo;
};

export class RegistryResponseDto {
  @IsObject()
  @IsNotEmpty()
  registry: RegistryObjectified;
}

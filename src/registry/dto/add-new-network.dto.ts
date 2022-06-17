import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddNewNetworkDto {
  /**
   * The name of the user
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The chain Id of the network
   */
  @IsString()
  @IsNotEmpty()
  chainId: string;

  /**
   * The address at which the distributor contract is deployed
   */
  @IsString()
  @IsNotEmpty()
  distributorAddress: string;

  /**
   * Native currency symbol of the network
   */
  @IsString()
  @IsNotEmpty()
  nativeCurrency: string;

  /**
   * Native currency name of the network
   */
  @IsString()
  @IsOptional()
  nativeCurrencyName: string;

  /**
   * Block explorer
   */
  @IsString()
  @IsNotEmpty()
  blockExplorer: string;

  /**
   * A node provider endpoint for the network
   */
  @IsString()
  @IsNotEmpty()
  provider: string;

  /**
   * Picture associated with network
   */
  @IsString()
  @IsNotEmpty()
  pictureUrl: string;

  /**
   * Is it a mainnet network?
   */
  @IsBoolean()
  @IsOptional()
  mainnet?: boolean;
}

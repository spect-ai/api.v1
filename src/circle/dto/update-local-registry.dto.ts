import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';

export class UpdateBlacklistDto {
  /**
   * The chain id that the token is on
   */
  @IsString()
  @IsNotEmpty()
  chainId: string;

  /**
   * The address of the token
   */
  @IsString()
  @IsNotEmpty()
  tokenAddress: string;

  /**
   * Whitelist or blacklist?
   */
  @IsString()
  @IsNotEmpty()
  action: 'whitelist' | 'blacklist';
}

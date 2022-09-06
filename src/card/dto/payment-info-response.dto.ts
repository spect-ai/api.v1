import { IsObject, IsString } from 'class-validator';

export type FlatennedTokenPaymentInfo = {
  userIds: string[];
  tokenAddresses: string[];
  values: string[];
};

export type FlatennedCurrencyPaymentInfo = {
  userIds: string[];
  values: string[];
};

export type ApprovalInfo = {
  /**
   * Unique token addresses
   */
  tokenAddresses: string[];

  /**
   * Minimum approved value required for transaction to succeed
   */
  values: string[];
};

export class AggregatedFlattenedPaymentInfo {
  @IsObject()
  tokens: FlatennedTokenPaymentInfo;

  @IsObject()
  currency: FlatennedCurrencyPaymentInfo;

  @IsObject()
  approval: ApprovalInfo;

  @IsString()
  chainId: string;
}

import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

export type TokenInfo = {
  address: string;
  symbol: string;
  name: string;
};

export type TokenDetails = {
  [tokenAddress: string]: TokenInfo;
};

@useMongoosePlugin()
export class Registry extends BaseModel {
  @prop({ required: true })
  chainId: string;

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  distributorAddress: string;

  @prop({ default: true })
  mainnet: boolean;

  @prop({ required: true })
  nativeCurrency: string;

  @prop({ required: true })
  pictureUrl: string;

  @prop({ required: true })
  blockExplorer: string;

  @prop({ required: true })
  provider: string;

  @prop({ required: true })
  tokenDetails: TokenDetails;
}

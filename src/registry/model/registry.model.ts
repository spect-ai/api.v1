import { prop, Ref } from '@typegoose/typegoose';
import { ProfileModel } from 'src/common/models/profile.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';
import { Payment } from 'src/common/models/payment.model';
import { ActivityModel } from 'src/common/models/activity.model';
import { Project } from 'src/project/model/project.model';
import { User } from 'src/users/model/users.model';
import { Chain } from 'src/common/models/chain.model';
import { ObjectId } from 'mongoose';
import { MemberRoles, Roles } from 'src/common/types/role.type';
import { Invite } from 'src/common/types/invite.type';
import { BaseModel } from 'src/base/base.model';

export type TokenInfo = {
  address: string;
  symbol: string;
  name: string;
  pictureUrl: string;
};

export type NetworkInfo = {
  tokenAddresses: string[];
  distributorAddress?: string;
  name: string;
  mainnet: boolean;
  chainId: string;
  nativeCurrency: string;
  pictureUrl: string;
  blockExplorer?: string;
  provider: string;
  tokens: { [tokenAddress: string]: TokenInfo };
};

export type Registry = {
  [chainId: string]: NetworkInfo;
};

@useMongoosePlugin()
export class RegistryModel extends BaseModel {
  @prop({ required: true })
  registry: Registry;
}

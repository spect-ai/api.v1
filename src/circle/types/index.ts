import { Chain } from 'src/common/models/chain.model';
import { Token } from 'src/common/models/token.model';
import { TokenInfo } from 'src/registry/model/registry.model';

export type TokenDetails = {
  [tokenAddress: string]: TokenInfo;
};

export type LocalRegistry = {
  [chainId: string]: TokenDetails;
};

export type TokenBlacklisted = {
  [tokenAddress: string]: boolean;
};

export type BlacklistRegistry = {
  [chainId: string]: TokenBlacklisted;
};

export type Invite = {
  id: string;
  roles: string[];
  uses: number;
  expires: Date;
};

export type DiscordToCircleRoles = {
  [role: string]: {
    circleRole: string[];
    name: string;
  };
};

export type PopulatedCircleFields = {
  projects?: { [fieldName: string]: number };
  parents?: { [fieldName: string]: number };
  children?: { [fieldName: string]: number };
  retro?: { [fieldName: string]: number };
  collections?: any;
  memberRoles?: number;
};

export type SafeAddresses = {
  [chaninId: string]: string[];
};

export type WhitelistedMembershipAddresses = {
  [address: string]: string[]; //Rokes
};

export type DiscordChannel = {
  id: string;
  name: string;
};

export type Folder = {
  name: string;
  avatar: string;
  contentIds?: string[];
};

export type Action = {
  id: string;
  type: string;
  subType?: string;
  name: string;
  service: string;
  data: any;
};

export type Trigger = {
  id: string;
  type: string;
  subType?: string;
  name: string;
  service: string;
  data: any;
};

export type Condition = {
  id: string;
  type: string;
  service: string;
  data: any;
};

export type Automation = {
  id: string;
  name: string;
  description: string;
  trigger: Trigger;
  actions: Action[];
  conditions?: Condition[];
  triggerCategory: 'collection' | 'root';
  triggerCollectionSlug?: string;
  disabled?: boolean;
};

export type AutomationType = {
  [id: string]: Automation;
};

export type AutomationsIndexedByCollectionSlugType = {
  [id: string]: string[];
};

export type RootAutomationsType = string[];

export type PaymentDetails = {
  id: string;
  type: 'manuallyAdded' | 'addedFromCard';
  chain: {
    label: string;
    value: string;
  };
  token: {
    label: string;
    value: string;
  };
  value: number;
  paidTo: {
    propertyType: string;
    value: any;
  }[];
  dataSlug?: string;
  collectionId?: string;
};

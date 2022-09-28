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
  collections?: { [fieldName: string]: number };
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
  projectIds: string[];
  workstreamIds: string[];
  retroIds: string[];
};

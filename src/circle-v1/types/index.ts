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
  projects?: { [fieldName: string]: 0 | 1 };
  parents?: { [fieldName: string]: 0 | 1 };
  children?: { [fieldName: string]: 0 | 1 };
};

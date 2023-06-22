export type KudosType = {
  kudosTokenId: number;
  headline: string;
  createdAt: string;
  assetUrl: string;
  claimStatus: string;
  communityId: string;
};

export type ZealyUserType = {
  id: string;
  name: string;
  discordHandle: string;
  twitterUsername: string;
  addresses: {
    blockchain: string;
    address: string;
  }[];
  avatar: string;
  xp: number;
  level: number;
  rank: number;
  createdAt: Date;
  updatedAt: Date;
};

export type NFTFromAnkr = {
  contractAddress: string;
  blockchain: string;
  collectionName: string;
  symbol: string;
  tokenId: string;
  contractType: string;
  tokenUrl: string;
  name: string;
  imageUrl: string;
};

export type GitcoinPassportWithVerifiedCredentials = {
  next: string | null;
  prev: string | null;
  items: GitcoinPassportVerifiedCredentials;
};

export type GitcoinPassportVerifiedCredentials = {
  version: string;
  credential: GitcoinPassportVerifiedCredential;
}[];

export type GitcoinPassportVerifiedCredential = {
  type: string[];
  proof: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
  credentialSubject: {
    id: string;
    hash: string;
    provider: string;
    '@context': object;
  };
  expirationDate: string;
  issuanceDate: string;
  issuer: string;
};

export type GitcoinPassportMinimalStampOnSpect = {
  id: string;
  provider: string;
  providerName: string;
  providerUrl: string;
  providerImage: string;
  issuer: string;
  issuerName: string;
  defaultScore: number;
  stampName: string;
  stampDescription: string;
  score?: number;
  verified?: boolean;
};

export type GitcoinPassportIndividualStamp = {
  name: string;
  description: string;
  hash: string;
};

export type GitcoinPassportStampGroup = {
  name: string;
  stamps: GitcoinPassportIndividualStamp[];
};

export type GitcoinPassportStampsOfAProviderPlatform = {
  id: string;
  icon: string;
  name: string;
  description: string;
  connectMessage: string;
  groups: GitcoinPassportStampGroup[];
};

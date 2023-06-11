export type MazuryCredentialType = {
  id: string;
  badge_type: {
    created_at: string;
    description: string;
    external_image_url: string;
    id: string;
    image: string;
    issuer: {
      name: string;
    };
    slug: string;
    title: string;
    updated_at: string;
    total_supply: number;
    video?: string;
  };
  created_at: string;
  external_links: { [key: string]: string };
  hidden: boolean;
  token_id: string;
  owner: {
    eth_address: string;
    ens_name: string;
    avatar: string;
    username: string;
  };
};

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

export type GitcoinPassport = {
  next: string | null;
  prev: string | null;
  items: GitcoinPassportCredentials;
};

export type GitcoinPassportCredentials = {
  version: string;
  credential: GitcoinPassportCredential;
}[];

export type GitcoinPassportCredential = {
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

export type GitcoinPassportMinimalStamp = {
  id: string;
  provider: string;
  providerName:
    | 'Gitcoin'
    | 'Discord'
    | 'Twitter'
    | 'Github'
    | 'Linkedin'
    | 'Lens'
    | 'Google'
    | 'Facebook'
    | 'Poh'
    | 'Brightid'
    | 'POAP'
    | 'ETH'
    | 'NFT'
    | 'GnosisSafe'
    | 'Snapshot';
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

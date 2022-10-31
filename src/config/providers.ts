import { PLATFORM_ID } from './types';

export type ProviderSpec = {
  title: string;
  name: string;
  icon?: string;
  description?: string;
  defaultScore?: number;
};

export type PlatformGroupSpec = {
  providers: ProviderSpec[];
  platformGroup: string;
};

export type UpdatedPlatforms = {
  [key: string]: boolean;
};

// Platform -> Provider[]
export type Providers = {
  [platform in string]: PlatformGroupSpec[];
};

export const STAMP_PROVIDERS: Readonly<Providers> = {
  Google: [
    {
      platformGroup: 'Account Name',
      providers: [
        {
          title: 'Google Account',
          name: 'Google',
          description: 'Has a Google Account',
          defaultScore: 0.1,
        },
      ],
    },
  ],
  Ens: [
    {
      platformGroup: 'Account Name',
      providers: [
        {
          title: 'Owner of a ENS domain',
          name: 'Ens',
          description: 'Has at least one ENS domain',
          defaultScore: 0.1,
        },
      ],
    },
  ],
  Poh: [
    {
      platformGroup: 'Account Name',
      providers: [
        {
          title: 'Proof of Humanity',
          name: 'Poh',
          defaultScore: 0.4,
          description: 'Verified on Proof of Humanity',
        },
      ],
    },
  ],
  Twitter: [
    {
      platformGroup: 'Account Name',
      providers: [
        {
          title: 'Twitter Account',
          name: 'Twitter',
          description: 'Has a Twitter Account',
          defaultScore: 0.1,
        },
      ],
    },
    {
      platformGroup: 'Tweet/Posts',
      providers: [
        {
          title: 'Twitter Post',
          name: 'TwitterTweetGT10',
          description: 'Has more than 10 tweets',
          defaultScore: 0.15,
        },
      ],
    },
    {
      platformGroup: 'Followers',
      providers: [
        {
          title: 'Twitter Follower',
          name: 'TwitterFollowerGT100',
          description: 'Has more than 100 followers',
          defaultScore: 0.15,
        },
        {
          title: 'Twitter Follower',
          name: 'TwitterFollowerGT500',
          description: 'Has more than 500 followers',
          defaultScore: 0.2,
        },
        {
          title: 'Twitter Follower',
          name: 'TwitterFollowerGTE1000',
          description: 'Has more than 1000 followers',
          defaultScore: 0.25,
        },
        {
          title: 'Twitter Follower',
          name: 'TwitterFollowerGT5000',
          description: 'Has more than 5000 followers',
          defaultScore: 0.3,
        },
      ],
    },
  ],
  POAP: [
    {
      platformGroup: 'Account Name',
      providers: [
        {
          title: 'POAP Ownership',
          name: 'POAP',
          description: 'Has owned a POAP for more than 15 days',
          defaultScore: 0.1,
        },
      ],
    },
  ],
  Facebook: [
    {
      platformGroup: 'Account Name',
      providers: [
        {
          title: 'Facebook Account',
          name: 'Facebook',
          description: 'Has a Facebook Account',
          defaultScore: 0.1,
        },
      ],
    },
    {
      platformGroup: 'Friends',
      providers: [
        {
          title: 'Facebook Friends',
          name: 'FacebookFriends',
          description: 'Has more than 100 friends',
          defaultScore: 0.15,
        },
      ],
    },
    {
      platformGroup: 'Profile',
      providers: [
        {
          title: 'Facebook Profile Picture',
          name: 'FacebookProfilePicture',
          description: 'Has a profile picture',
          defaultScore: 0.15,
        },
      ],
    },
  ],
  Brightid: [
    {
      platformGroup: 'Account Name',
      providers: [
        {
          title: 'BrightID',
          name: 'Brightid',
          description: 'Has a BrightID verified Account',
          defaultScore: 0.4,
        },
      ],
    },
  ],
  Github: [
    {
      platformGroup: 'Account Name',
      providers: [
        {
          title: 'Github Account',
          name: 'Github',
          description: 'Has a Github Account',
          defaultScore: 0.1,
        },
      ],
    },
    {
      platformGroup: 'Repositories',
      providers: [
        {
          title: 'Github Repository',
          name: 'FiveOrMoreGithubRepos',
          description: 'Has five or more Github repos',
          defaultScore: 0.05,
        },
        {
          title: 'Github Repository',
          name: 'ForkedGithubRepoProvider',
          description: 'Has at least 1 Github repo forked by another user',
          defaultScore: 0.1,
        },
        {
          title: 'Github Repository',
          name: 'StarredGithubRepoProvider',
          description: 'Has at least 1 Github repo starred by another user',
          defaultScore: 0.1,
        },
      ],
    },
    {
      platformGroup: 'Followers',
      providers: [
        {
          title: 'Github Follower',
          name: 'TenOrMoreGithubFollowers',
          description: 'Has more than 10 Github followers',
          defaultScore: 0.2,
        },
        {
          title: 'Github Follower',
          name: 'FiftyOrMoreGithubFollowers',
          description: 'Has more than 50 Github followers',
          defaultScore: 0.3,
        },
      ],
    },
  ],
  Gitcoin: [
    {
      platformGroup: 'Contributed to...',
      providers: [
        {
          title: 'Public Goods Funder on Gitcoin',
          name: 'GitcoinContributorStatistics#numGrantsContributeToGte#1',
          description: 'Has contributed to more than 1 Grant',
          defaultScore: 0.1,
        },
        {
          title: 'Public Goods Funder on Gitcoin',
          name: 'GitcoinContributorStatistics#numGrantsContributeToGte#10',
          description: 'Has contributed to more than 10 Grants',
          defaultScore: 0.15,
        },
        {
          title: 'Public Goods Funder on Gitcoin',
          name: 'GitcoinContributorStatistics#numGrantsContributeToGte#25',
          description: 'Has contributed to more than 25 Grants',
          defaultScore: 0.2,
        },
        {
          title: 'Public Goods Funder on Gitcoin',
          name: 'GitcoinContributorStatistics#numGrantsContributeToGte#100',
          description: 'Has contributed to more than 100 Grants',
          defaultScore: 0.25,
        },
      ],
    },
    {
      platformGroup: 'Contributed in...',
      providers: [
        {
          title: 'GR14 Funder',
          name: 'GitcoinContributorStatistics#numGr14ContributionsGte#1',
          description: 'Has contributed to GR14',
          defaultScore: 0.1,
        },
        {
          title: 'More than 1 grant round funder',
          name: 'GitcoinContributorStatistics#numRoundsContributedToGte#1',
          description: 'Has contributed to more than 1 Round',
          defaultScore: 0.15,
        },
      ],
    },
    {
      platformGroup: 'Owner of...',
      providers: [
        {
          title: 'Gitcoin Grant Owner',
          name: 'GitcoinGranteeStatistics#numOwnedGrants#1',
          description: 'Owns a Gitcoin Grant',
          defaultScore: 0.1,
        },
      ],
    },
    {
      platformGroup: 'Grants have more than...',
      providers: [
        {
          title: 'Gitcoin Grant Owner',
          name: 'GitcoinGranteeStatistics#numGrantContributors#10',
          description: 'Has more than 10 Contributors on a grant they own',
          defaultScore: 0.1,
        },
        {
          title: 'Gitcoin Grant Owner',
          name: 'GitcoinGranteeStatistics#numGrantContributors#25',
          description: 'Has more than 25 Contributors on a grant they own',
          defaultScore: 0.15,
        },
        {
          title: 'Gitcoin Grant Owner',
          name: 'GitcoinGranteeStatistics#numGrantContributors#100',
          description: 'Has more than 100 Contributors on a grant they own',
          defaultScore: 0.2,
        },
      ],
    },
  ],
  Linkedin: [
    {
      platformGroup: 'Account Name',
      providers: [
        {
          title: 'Linkedin Account',
          name: 'Linkedin',
          defaultScore: 0.1,
          description: 'Has a Linkedin Account',
        },
      ],
    },
  ],
  Discord: [
    {
      platformGroup: 'Account Name',
      providers: [
        {
          title: 'Discord Account',
          name: 'Discord',
          defaultScore: 0.1,
          description: 'Has a Discord Account',
        },
      ],
    },
  ],
  Snapshot: [
    {
      platformGroup: 'Snapshot Voter',
      providers: [
        {
          title: 'Governance Voter',
          name: 'SnapshotVotesProvider',
          description: 'Has voted on 2 or more DAO proposals',
          defaultScore: 0.1,
        },
      ],
    },
    {
      platformGroup: 'Snapshot Proposal Creator',
      providers: [
        {
          title: 'Governance Proposal Creator',
          description:
            'Created a DAO proposal that was voted on by at least 1 account',
          name: 'SnapshotProposalsProvider',
          defaultScore: 0.2,
        },
      ],
    },
  ],
  ETH: [
    {
      platformGroup: 'Transactions',
      providers: [
        {
          title: 'Transaction Occurrence',
          name: 'FirstEthTxnProvider',
          description: 'First ETH transaction occurred more than 30 days ago',
          defaultScore: 0.1,
        },
      ],
    },
    {
      platformGroup: 'Gas fees spent',
      providers: [
        {
          title: 'Gas Fees Spent',
          name: 'EthGasProvider',
          description: 'Has spent more than 0.1 ETH in gas fees',
          defaultScore: 0.1,
        },
      ],
    },
  ],
  NFT: [
    {
      platformGroup: 'NFT Holder',
      providers: [
        {
          title: 'NFT Holder',
          description: 'Holds at least 1 NFT',
          name: 'NFT',
          defaultScore: 0.1,
        },
      ],
    },
  ],

  Lens: [
    {
      platformGroup: 'Lens Handle',
      providers: [
        {
          title: 'Lens Handle Owner',
          name: 'Lens',
          defaultScore: 0.1,
          description: 'Has at least one Lens Handle',
        },
      ],
    },
  ],
  GnosisSafe: [
    {
      platformGroup: 'Account Name',
      providers: [
        {
          title: 'Gnosis Safe Signer',
          name: 'GnosisSafe',
          defaultScore: 0.1,
          description: 'Signer on a Gnosis Safe',
        },
      ],
    },
  ],
};

import { MappedItem } from 'src/common/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { Property } from '../types/types';

export const onboardingFormProperties = {
  Status: {
    name: 'Status',
    type: 'singleSelect',
    options: [
      {
        label: 'Submitted',
        value: uuidv4(),
      },
      {
        label: 'Accepted',
        value: uuidv4(),
      },
      {
        label: 'Rejected',
        value: uuidv4(),
      },
    ],
    isPartOfFormView: false,
    rewardOptions: {},
    description: '',
    required: false,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
  'Project Name': {
    name: 'Project Name',
    type: 'shortText',
    options: [
      {
        label: 'Option 1',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {},
    description: '',
    default: '',
    isPartOfFormView: true,
    required: true,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
  'About your Project': {
    name: 'About your Project',
    type: 'longText',
    options: [
      {
        label: 'Option 1',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {},
    description:
      'Describe how your venture would solve the problems in Web3, how your team when around shipping it ',
    default: '',
    isPartOfFormView: true,
    required: true,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
  Email: {
    name: 'Email',
    type: 'email',
    isPartOfFormView: true,
    description: '',
    options: [
      {
        label: 'Option 1',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {},
    required: true,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
  Milestones: {
    name: 'Milestones',
    type: 'milestone',
    isPartOfFormView: true,
    description:
      'Give a detailed description on the milestones you would want to achieve during this grant program',
    options: [
      {
        label: 'Option 1',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {
      '1': {
        _id: '630290ffda7d9b0c5ccd31b7',
        chainId: '1',
        name: 'Mainnet',
        distributorAddress: '0xD620b76e0dE2A776449E2969Bf8B725ECDA5b66e',
        mainnet: true,
        nativeCurrency: 'ETH',
        pictureUrl:
          'https://ipfs.moralis.io:2053/ipfs/QmWs35c2hoYMEzfhCY62M6i9E1KMgW8znoE8F2xtj4QEsy',
        blockExplorer: 'https://etherscan.io/',
        provider:
          'https://eth-mainnet.g.alchemy.com/v2/97jAndtiByElrpSUeLEP7oZsXl-1V675',
        tokenDetails: {
          '0x0': {
            symbol: 'ETH',
            name: 'ETH',
            address: '0x0',
          },
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
            symbol: 'USDC',
            name: 'USDC',
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          },
          '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
            symbol: 'DAI',
            name: 'DAI',
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          },
          '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
            symbol: 'USDT',
            name: 'USDT',
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          },
        },
        createdAt: '2022-06-27T01:41:41.242Z',
        updatedAt: '2022-06-27T01:41:41.242Z',
        id: '630290ffda7d9b0c5ccd31b7',
      },
      '137': {
        _id: '62b8fc1fb4a7e8cb15182309',
        chainId: '137',
        name: 'polygon',
        distributorAddress: '0xD38028814eC0AAD592c97dE015B6F7ee5c019B48',
        mainnet: true,
        nativeCurrency: 'MATIC',
        pictureUrl:
          'https://ipfs.moralis.io:2053/ipfs/QmRNqgazYuxUa5WdddFPftTWiP3KwzBMgV9Z19QWnLMETc',
        blockExplorer: 'https://polygonscan.com/',
        provider: 'https://polygon-rpc.com',
        tokenDetails: {
          '0x0': {
            address: '0x0',
            symbol: 'MATIC',
            name: 'Matic',
            blacklisted: false,
          },
          '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270': {
            address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
            symbol: 'WMATIC',
            name: 'Wrapped MATIC',
            blacklisted: false,
          },
        },
        createdAt: '2022-06-27T00:38:55.296Z',
        updatedAt: '2022-06-27T01:23:28.582Z',
        id: '62b8fc1fb4a7e8cb15182309',
        '0x0': {
          address: '0x0',
          symbol: 'MATIC',
          name: 'Matic',
          blacklisted: false,
        },
      },
    },
    required: true,
    milestoneFields: ['name', 'description', 'dueDate', 'reward'],
    viewConditions: [],
    payWallOptions: {},
  },
  'About the Team': {
    name: 'About the Team',
    type: 'longText',
    options: [
      {
        label: 'Option 1',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {},
    description: '',
    isPartOfFormView: true,
    required: false,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
  'Total Reward': {
    name: 'Total Reward',
    type: 'reward',
    isPartOfFormView: true,
    description: '',
    options: [
      {
        label: 'Option 1',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {
      '1': {
        _id: '630290ffda7d9b0c5ccd31b7',
        chainId: '1',
        name: 'Mainnet',
        distributorAddress: '0xD620b76e0dE2A776449E2969Bf8B725ECDA5b66e',
        mainnet: true,
        nativeCurrency: 'ETH',
        pictureUrl:
          'https://ipfs.moralis.io:2053/ipfs/QmWs35c2hoYMEzfhCY62M6i9E1KMgW8znoE8F2xtj4QEsy',
        blockExplorer: 'https://etherscan.io/',
        provider:
          'https://eth-mainnet.g.alchemy.com/v2/97jAndtiByElrpSUeLEP7oZsXl-1V675',
        tokenDetails: {
          '0x0': {
            symbol: 'ETH',
            name: 'ETH',
            address: '0x0',
          },
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
            symbol: 'USDC',
            name: 'USDC',
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          },
          '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
            symbol: 'DAI',
            name: 'DAI',
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          },
          '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
            symbol: 'USDT',
            name: 'USDT',
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          },
        },
        createdAt: '2022-06-27T01:41:41.242Z',
        updatedAt: '2022-06-27T01:41:41.242Z',
        id: '630290ffda7d9b0c5ccd31b7',
      },
      '137': {
        _id: '62b8fc1fb4a7e8cb15182309',
        chainId: '137',
        name: 'polygon',
        distributorAddress: '0xD38028814eC0AAD592c97dE015B6F7ee5c019B48',
        mainnet: true,
        nativeCurrency: 'MATIC',
        pictureUrl:
          'https://ipfs.moralis.io:2053/ipfs/QmRNqgazYuxUa5WdddFPftTWiP3KwzBMgV9Z19QWnLMETc',
        blockExplorer: 'https://polygonscan.com/',
        provider: 'https://polygon-rpc.com',
        tokenDetails: {
          '0x0': {
            address: '0x0',
            symbol: 'MATIC',
            name: 'Matic',
            blacklisted: false,
          },
          '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270': {
            address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
            symbol: 'WMATIC',
            name: 'Wrapped MATIC',
            blacklisted: false,
          },
        },
        createdAt: '2022-06-27T00:38:55.296Z',
        updatedAt: '2022-06-27T01:23:28.582Z',
        id: '62b8fc1fb4a7e8cb15182309',
        '0x0': {
          address: '0x0',
          symbol: 'MATIC',
          name: 'Matic',
          blacklisted: false,
        },
      },
    },
    required: true,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
} as unknown as MappedItem<Property>;

export const onboardingFormPropertyOrder = [
  'Project Name',
  'About your Project',
  'Status',
  'About the Team',
  'Email',
  'Milestones',
  'Total Reward',
];

export const milestoneProperties = {
  Title: {
    name: 'Title',
    type: 'shortText',
    default: '',
    isPartOfFormView: true,
    immutable: true,
  },
  Description: {
    name: 'Description',
    type: 'longText',
    default: '',
    isPartOfFormView: true,
  },
  Status: {
    name: 'Status',
    type: 'singleSelect',
    options: [
      {
        label: 'To Do',
        value: uuidv4(),
      },
      {
        label: 'In Progress',
        value: uuidv4(),
      },
      {
        label: 'Done',
        value: uuidv4(),
      },
    ],
    isPartOfFormView: false,
  },
  Reward: {
    name: 'Reward',
    type: 'reward',
    options: [
      {
        label: 'Option 1',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {
      '137': {
        _id: '62b8fc1fb4a7e8cb15182309',
        chainId: '137',
        name: 'polygon',
        distributorAddress: '0xD38028814eC0AAD592c97dE015B6F7ee5c019B48',
        mainnet: true,
        nativeCurrency: 'MATIC',
        pictureUrl:
          'https://ipfs.moralis.io:2053/ipfs/QmRNqgazYuxUa5WdddFPftTWiP3KwzBMgV9Z19QWnLMETc',
        blockExplorer: 'https://polygonscan.com/',
        provider: 'https://polygon-rpc.com',
        tokenDetails: {
          '0x0': {
            address: '0x0',
            symbol: 'MATIC',
            name: 'Matic',
            blacklisted: false,
          },
          '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270': {
            address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
            symbol: 'WMATIC',
            name: 'Wrapped MATIC',
            blacklisted: false,
          },
        },
        createdAt: '2022-06-27T00:38:55.296Z',
        updatedAt: '2022-06-27T01:23:28.582Z',
        id: '62b8fc1fb4a7e8cb15182309',
        '0x0': {
          address: '0x0',
          symbol: 'MATIC',
          name: 'Matic',
          blacklisted: false,
        },
      },
    },
    description: '',
    isPartOfFormView: true,
    required: false,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
  'Due Date': {
    name: 'Due Date',
    type: 'date',
    isPartOfFormView: true,
    description: '',
    options: [
      {
        label: 'Option 1',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {},
    required: false,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
} as unknown as MappedItem<Property>;

export const milestonePropertyOrder = [
  'Title',
  'Description',
  'Status',
  'Reward',
  'Due Date',
];

export const granteeCollectionProperties = {
  Title: {
    name: 'Title',
    type: 'shortText',
    default: '',
    isPartOfFormView: true,
    immutable: true,
  },
  Description: {
    name: 'Description',
    type: 'longText',
    default: '',
    isPartOfFormView: true,
  },
  Status: {
    name: 'Status',
    type: 'singleSelect',
    options: [
      {
        label: 'Submitted',
        value: uuidv4(),
      },
      {
        label: 'Accepted',
        value: uuidv4(),
      },
      {
        label: 'Rejected',
        value: uuidv4(),
      },
    ],
    isPartOfFormView: false,
    rewardOptions: {},
    description: '',
    required: false,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
  Email: {
    name: 'Email',
    type: 'email',
    isPartOfFormView: true,
    description: '',
    options: [
      {
        label: 'Option 1',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {},
    required: false,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
  Milestones: {
    name: 'Milestones',
    type: 'milestone',
    isPartOfFormView: true,
    description: '',
    options: [
      {
        label: 'Option 1',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {
      '137': {
        _id: '62b8fc1fb4a7e8cb15182309',
        chainId: '137',
        name: 'polygon',
        distributorAddress: '0xD38028814eC0AAD592c97dE015B6F7ee5c019B48',
        mainnet: true,
        nativeCurrency: 'MATIC',
        pictureUrl:
          'https://ipfs.moralis.io:2053/ipfs/QmRNqgazYuxUa5WdddFPftTWiP3KwzBMgV9Z19QWnLMETc',
        blockExplorer: 'https://polygonscan.com/',
        provider: 'https://polygon-rpc.com',
        tokenDetails: {
          '0x0': {
            address: '0x0',
            symbol: 'MATIC',
            name: 'Matic',
            blacklisted: false,
          },
          '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270': {
            address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
            symbol: 'WMATIC',
            name: 'Wrapped MATIC',
            blacklisted: false,
          },
        },
        createdAt: '2022-06-27T00:38:55.296Z',
        updatedAt: '2022-06-27T01:23:28.582Z',
        id: '62b8fc1fb4a7e8cb15182309',
        '0x0': {
          address: '0x0',
          symbol: 'MATIC',
          name: 'Matic',
          blacklisted: false,
        },
      },
    },
    required: false,
    milestoneFields: ['name', 'description', 'dueDate', 'reward'],
    viewConditions: [],
    payWallOptions: {},
  },
  'Total Reward': {
    name: 'Total Reward',
    type: 'reward',
    isPartOfFormView: true,
    description: '',
    options: [
      {
        label: 'Option 1',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {
      '137': {
        _id: '62b8fc1fb4a7e8cb15182309',
        chainId: '137',
        name: 'polygon',
        distributorAddress: '0xD38028814eC0AAD592c97dE015B6F7ee5c019B48',
        mainnet: true,
        nativeCurrency: 'MATIC',
        pictureUrl:
          'https://ipfs.moralis.io:2053/ipfs/QmRNqgazYuxUa5WdddFPftTWiP3KwzBMgV9Z19QWnLMETc',
        blockExplorer: 'https://polygonscan.com/',
        provider: 'https://polygon-rpc.com',
        tokenDetails: {
          '0x0': {
            address: '0x0',
            symbol: 'MATIC',
            name: 'Matic',
            blacklisted: false,
          },
          '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270': {
            address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
            symbol: 'WMATIC',
            name: 'Wrapped MATIC',
            blacklisted: false,
          },
        },
        createdAt: '2022-06-27T00:38:55.296Z',
        updatedAt: '2022-06-27T01:23:28.582Z',
        id: '62b8fc1fb4a7e8cb15182309',
        '0x0': {
          address: '0x0',
          symbol: 'MATIC',
          name: 'Matic',
          blacklisted: false,
        },
      },
    },
    required: false,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
  'Team Info': {
    name: 'Team Info',
    type: 'longText',
    isPartOfFormView: true,
    description: '',
    options: [
      {
        label: 'Option 1',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {},
    required: false,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
  Assignee: {
    name: 'Assignee',
    type: 'user[]',
    isPartOfFormView: true,
    description: '',
    options: [
      {
        label: 'Option 1',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {},
    required: false,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
} as unknown as MappedItem<Property>;

export const granteeCollectionPropertyOrder = [
  'Title',
  'Description',
  'Status',
  'Email',
  'Milestones',
  'Total Reward',
  'Team Info',
  'Assignee',
];

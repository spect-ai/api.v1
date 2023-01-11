import { Property } from 'src/collection/types/types';
import { MappedItem } from 'src/common/interfaces';
import { v4 as uuidv4 } from 'uuid';

export const granteeStatus = {
  inProgress: uuidv4(),
  completed: uuidv4(),
  churned: uuidv4(),
};

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
        label: 'In Progress',
        value: granteeStatus.inProgress,
      },
      {
        label: 'Completed',
        value: granteeStatus.completed,
      },
      {
        label: 'Churned',
        value: granteeStatus.churned,
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

import { MappedItem } from 'src/common/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { Property } from '../../../types/types';

export const mileStoneStatus = {
  todo: uuidv4(),
  inProgress: uuidv4(),
  done: uuidv4(),
};

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
        value: mileStoneStatus.todo,
      },
      {
        label: 'In Progress',
        value: mileStoneStatus.inProgress,
      },
      {
        label: 'Done',
        value: mileStoneStatus.done,
      },
    ],
    isPartOfFormView: false,
  },
  Reward: {
    name: 'Reward',
    type: 'reward',
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

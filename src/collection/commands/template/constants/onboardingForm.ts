import { MappedItem } from 'src/common/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { Property } from '../../../types/types';
import { mileStoneStatus } from './milestonecollection';
import { granteeStatus } from './granteecollection';

const submitted = uuidv4();
const accepted = uuidv4();
const rejected = uuidv4();

export const onboardingFormProperties = {
  Status: {
    name: 'Status',
    type: 'singleSelect',
    options: [
      {
        label: 'Submitted',
        value: submitted,
      },
      {
        label: 'Accepted',
        value: accepted,
      },
      {
        label: 'Rejected',
        value: rejected,
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
  ['Project Name']: {
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
  ['About your Project']: {
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
  ['About the Team']: {
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
  ['Total Reward']: {
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

export function getAutomations(
  circleId: string,
  granteeId: string,
  granteeSlug: string,
  triggerSlug: string,
) {
  const automations = [
    {
      name: 'Rejected',
      description:
        'These automations are rejected when a grant application is rejected',
      trigger: {
        id: 'dataChange',
        type: 'dataChange',
        subType: 'singleSelect',
        name: '"Status" changes',
        data: {
          fieldName: 'Status',
          fieldType: 'singleSelect',
          from: [
            {
              label: 'Submitted',
              value: submitted,
            },
          ],
          to: [
            {
              label: 'Accepted',
              value: accepted,
            },
          ],
        },
        service: 'collection',
      },
      actions: [
        {
          id: 'sendEmail',
          name: 'Send Email',
          service: 'email',
          type: 'sendEmail',
          data: {
            toEmailProperties: ['Email'],
            circleId: circleId,
            message:
              "We're sorry to inform you that your grant application has been rejected. We wish you the best for your future endeavors. ",
          },
        },
      ],
      conditions: [],
      triggerCategory: 'collection',
      triggerCollectionSlug: triggerSlug,
    },
    {
      name: 'Submission',
      description: '',
      trigger: {
        id: 'newData',
        type: 'newData',
        name: 'New Response is added',
        service: 'collection',
      },
      actions: [
        {
          id: 'createCard',
          name: 'Create Card',
          service: 'collection',
          type: 'createCard',
          data: {
            selectedCollection: {
              label: 'Grantees',
              value: granteeId,
              data: {
                name: 'Grantees',
                slug: granteeSlug,
                properties: {
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
                    immutable: true,
                  },
                  Status: {
                    name: 'Status',
                    type: 'singleSelect',
                    options: [
                      {
                        label: 'Submitted',
                        value: granteeStatus.submitted,
                      },
                      {
                        label: 'Accepted',
                        value: granteeStatus.accepted,
                      },
                      {
                        label: 'Rejected',
                        value: granteeStatus.rejected,
                      },
                    ],
                    isPartOfFormView: false,
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
                        distributorAddress:
                          '0x54904743F2A0d0BCC228e334bF52d4b578901cfB',
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
                            address:
                              '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
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
                    milestoneFields: [
                      'name',
                      'description',
                      'dueDate',
                      'reward',
                    ],
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
                        distributorAddress:
                          '0x54904743F2A0d0BCC228e334bF52d4b578901cfB',
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
                            address:
                              '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
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
                },
                propertyOrder: [
                  'Title',
                  'Description',
                  'Status',
                  'Email',
                  'Milestones',
                  'Total Reward',
                  'Team Info',
                  'Assignee',
                ],
                collectionType: 1,
                id: '63bc47e794a45ed1d953b580',
              },
            },
            values: [
              {
                type: 'mapping',
                mapping: {
                  to: {
                    label: 'Title',
                    value: 'Title',
                    data: {
                      type: 'shortText',
                    },
                  },
                  from: {
                    label: 'Project Name',
                    value: 'Project Name',
                  },
                },
              },
              {
                type: 'mapping',
                mapping: {
                  to: {
                    label: 'Description',
                    value: 'Description',
                    data: {
                      type: 'longText',
                    },
                  },
                  from: {
                    label: 'About your Project',
                    value: 'About your Project',
                  },
                },
              },
              {
                type: 'mapping',
                mapping: {
                  to: {
                    label: 'Team Info',
                    value: 'Team Info',
                    data: {
                      type: 'longText',
                    },
                  },
                  from: {
                    label: 'About the Team',
                    value: 'About the Team',
                  },
                },
              },
              {
                type: 'mapping',
                mapping: {
                  to: {
                    label: 'Email',
                    value: 'Email',
                    data: {
                      type: 'email',
                    },
                  },
                  from: {
                    label: 'Email',
                    value: 'Email',
                  },
                },
              },
              {
                type: 'mapping',
                mapping: {
                  to: {
                    label: 'Total Reward',
                    value: 'Total Reward',
                    data: {
                      type: 'reward',
                    },
                  },
                  from: {
                    label: 'Total Reward',
                    value: 'Total Reward',
                  },
                },
              },
              {
                type: 'mapping',
                mapping: {
                  to: {
                    label: 'Milestones',
                    value: 'Milestones',
                    data: {
                      type: 'milestone',
                    },
                  },
                  from: {
                    label: 'Milestones',
                    value: 'Milestones',
                  },
                },
              },
              {
                type: 'responder',
                mapping: {
                  to: {
                    label: 'Assignee',
                    value: 'Assignee',
                    data: {
                      type: 'user[]',
                    },
                  },
                },
              },
            ],
          },
        },
      ],
      conditions: [],
      triggerCategory: 'collection',
      triggerCollectionSlug: triggerSlug,
    },
  ];

  return automations;
}

import { MappedItem } from 'src/common/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { Property } from '../../../../../types/types';
import { mileStoneStatus } from './milestonecollection';
import { granteeStatus } from './granteecollection';

const inProgress = uuidv4();
const completed = uuidv4();
const churned = uuidv4();

export const getGrantApplicationFormProperties = (registry) => {
  const properties = {
    Status: {
      name: 'Status',
      type: 'singleSelect',
      options: [
        {
          label: 'In Progress',
          value: inProgress,
        },
        {
          label: 'Completed',
          value: completed,
        },
        {
          label: 'Churned',
          value: churned,
        },
      ],
      default: {
        label: 'In Progress',
        value: inProgress,
      },
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
      rewardOptions: registry,
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
      rewardOptions: registry,
      required: true,
      milestoneFields: [],
      viewConditions: [],
      payWallOptions: {},
    },
  } as unknown as MappedItem<Property>;
  return properties;
};

export const grantApplicationFormPropertyOrder = [
  'Project Name',
  'About your Project',
  'Status',
  'About the Team',
  'Email',
  'Milestones',
  'Total Reward',
];

export function getGrantWorkflowAutomations(
  circleId: string,
  granteeId: string,
  granteeSlug: string,
  milestoneId: string,
  milestoneSlug: string,
  triggerSlug: string,
  roles?: {
    [key: string]: boolean;
  },
  channelCategory?: {
    label: string;
    value: string;
  },
  registry?: any,
) {
  const dicordRole =
    roles && Object.keys(roles).length > 0
      ? {
          id: 'giveDiscordRole',
          name: 'Give Discord Role',
          service: 'circle',
          type: 'giveDiscordRole',
          data: {
            roles,
            circleId: circleId,
          },
        }
      : {};
  const discordChannel = channelCategory?.value
    ? {
        id: 'createDiscordChannel',
        name: 'Create Discord Channel',
        service: 'discord',
        type: 'createDiscordChannel',
        data: {
          channelName: {
            label: 'Map from value in "Project Name"',
            value: 'Project Name',
          },
          channelCategory,
          channelNameType: 'mapping',
          isPrivate: false,
          addResponder: false,
          rolesToAdd: {},
          circleId: circleId,
        },
      }
    : {};
  const automations = [
    {
      name: 'In Progress',
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
                    rewardOptions: registry,
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
                    rewardOptions: registry,
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
                id: granteeId,
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
              {
                type: 'default',
                default: {
                  field: {
                    label: 'Status',
                    value: 'Status',
                    data: {
                      type: 'singleSelect',
                    },
                  },
                  value: {
                    label: 'In Progress',
                    value: granteeStatus.inProgress,
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
    {
      name: 'Completed',
      description: '',
      trigger: {
        id: 'dataChange',
        type: 'dataChange',
        subType: 'singleSelect',
        name: '"Status" changes',
        data: {
          fieldName: 'Status',
          fieldType: 'singleSelect',
          to: [
            {
              label: 'Completed',
              value: completed,
            },
          ],
          from: [
            {
              label: 'In Progress',
              value: inProgress,
            },
          ],
        },
        service: 'collection',
      },
      actions: [
        {
          id: 'giveRole',
          name: 'Give Circle Role',
          service: 'circle',
          type: 'giveRole',
          data: {
            roles: {
              grantee: true,
            },
            circleId: circleId,
          },
        },
        {
          id: 'sendEmail',
          name: 'Send Email',
          service: 'email',
          type: 'sendEmail',
          data: {
            toEmailProperties: ['Email'],
            circleId: circleId,
            message:
              "Bravo ! Your application has been accepted for the grants program. You will be awarded the role of a 'Grantee' in the DAO's Spect Circle.  Make sure to check it out using the button below\n",
          },
        },
        {
          id: 'createCard',
          name: 'Create Card',
          service: 'collection',
          type: 'createCard',
          data: {
            selectedCollection: {
              label: 'Milestones',
              value: milestoneId,
              data: {
                name: 'Milestones',
                slug: milestoneSlug,
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
                  },
                  'Project Name': {
                    name: 'Project Name',
                    type: 'shortText',
                    isPartOfFormView: true,
                    description: '',
                    rewardOptions: {},
                    required: false,
                    milestoneFields: [],
                    viewConditions: [],
                    payWallOptions: {},
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
                    isPartOfFormView: true,
                    description: '',
                    rewardOptions: registry,
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
                    options: [],
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
                  'Reward',
                  'Due Date',
                  'Project Name',
                ],
                collectionType: 1,
                id: milestoneId,
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
                    label: 'Milestones title',
                    value: 'Milestones.title',
                    data: {
                      type: 'shortText',
                      fieldType: 'milestone',
                      fieldName: 'Milestones',
                      subFieldName: 'title',
                    },
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
                    label: 'Milestones description',
                    value: 'Milestones.description',
                    data: {
                      type: 'longText',
                      fieldType: 'milestone',
                      fieldName: 'Milestones',
                      subFieldName: 'description',
                    },
                  },
                },
              },
              {
                type: 'mapping',
                mapping: {
                  to: {
                    label: 'Due Date',
                    value: 'Due Date',
                    data: {
                      type: 'date',
                    },
                  },
                  from: {
                    label: 'Milestones date',
                    value: 'Milestones.date',
                    data: {
                      type: 'date',
                      fieldType: 'milestone',
                      fieldName: 'Milestones',
                      subFieldName: 'dueDate',
                    },
                  },
                },
              },
              {
                type: 'mapping',
                mapping: {
                  to: {
                    label: 'Reward',
                    value: 'Reward',
                    data: {
                      type: 'reward',
                    },
                  },
                  from: {
                    label: 'Milestones reward',
                    value: 'Milestones.reward',
                    data: {
                      type: 'reward',
                      fieldType: 'milestone',
                      fieldName: 'Milestones',
                      subFieldName: 'reward',
                    },
                  },
                },
              },
              {
                type: 'mapping',
                mapping: {
                  to: {
                    label: 'Project Name',
                    value: 'Project Name',
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
                type: 'default',
                default: {
                  field: {
                    label: 'Status',
                    value: 'Status',
                    data: {
                      type: 'singleSelect',
                    },
                  },
                  value: {
                    label: 'To Do',
                    value: mileStoneStatus.todo,
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
    {
      name: 'Churned',
      description: '',
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
              label: 'In Progress',
              value: inProgress,
            },
          ],
          to: [
            {
              label: 'Churned',
              value: churned,
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
  ];

  if (roles && Object.keys(roles).length > 0)
    automations?.[1]?.actions.push(dicordRole as any);
  if (channelCategory?.value)
    automations?.[1]?.actions.push(discordChannel as any);

  return automations;
}

import { Property } from 'src/collection/types/types';
import { MappedItem } from 'src/common/interfaces';
import { v4 as uuidv4 } from 'uuid';

export const granteeStatus = {
  inProgress: uuidv4(),
  completed: uuidv4(),
  churned: uuidv4(),
};

export const getGranteeCollectionProperties = (registry) => {
  const props = {
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
      rewardOptions: registry,
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
  } as unknown as MappedItem<Property>;
  return props;
};

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

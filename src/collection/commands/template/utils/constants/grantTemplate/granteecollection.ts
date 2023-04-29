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
    [granteeCollectionPropertyOrder[0]]: {
      id: granteeCollectionPropertyOrder[0],
      name: 'Title',
      type: 'shortText',
      default: '',
      isPartOfFormView: true,
      immutable: true,
    },
    [granteeCollectionPropertyOrder[1]]: {
      id: granteeCollectionPropertyOrder[1],
      name: 'Description',
      type: 'longText',
      default: '',
      isPartOfFormView: true,
    },
    [granteeCollectionPropertyOrder[2]]: {
      id: granteeCollectionPropertyOrder[2],
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
    [granteeCollectionPropertyOrder[3]]: {
      id: granteeCollectionPropertyOrder[3],
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
    [granteeCollectionPropertyOrder[4]]: {
      id: granteeCollectionPropertyOrder[4],
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
    [granteeCollectionPropertyOrder[5]]: {
      id: granteeCollectionPropertyOrder[5],
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
    [granteeCollectionPropertyOrder[6]]: {
      id: granteeCollectionPropertyOrder[6],
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
    [granteeCollectionPropertyOrder[7]]: {
      id: granteeCollectionPropertyOrder[7],
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
  uuidv4(),
  uuidv4(),
  uuidv4(),
  uuidv4(),
  uuidv4(),
  uuidv4(),
];

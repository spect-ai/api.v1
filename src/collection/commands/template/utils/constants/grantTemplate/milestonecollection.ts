import { Property } from 'src/collection/types/types';
import { MappedItem } from 'src/common/interfaces';
import { v4 as uuidv4 } from 'uuid';

export const mileStoneStatus = {
  todo: uuidv4(),
  inProgress: uuidv4(),
  done: uuidv4(),
};

export const getMilestoneProperties = (registry) => {
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
      rewardOptions: registry,
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

export const milestonePropertyOrder = [
  'Title',
  'Description',
  'Status',
  'Reward',
  'Due Date',
  'Project Name',
  'Assignee',
];

import { Property } from 'src/collection/types/types';
import { MappedItem } from 'src/common/interfaces';
import { v4 as uuidv4 } from 'uuid';

export const projectStatus = {
  todo: uuidv4(),
  inProgress: uuidv4(),
  inReview: uuidv4(),
  done: uuidv4(),
};

export const difficultyLevel = {
  low: uuidv4(),
  medium: uuidv4(),
  high: uuidv4(),
  urgent: uuidv4(),
};

const labels = [
  'Design',
  'Testing',
  'Deployment',
  'Maintenance',
  'Feature',
  'Bug',
  'Chore',
  'Documentation',
  'Refactoring',
  'Research',
  'POC',
  'Frontend',
  'Backend',
  'Mobile',
  'Web',
  'API',
  'Database',
  'DevOps',
  'Security',
  'UX',
  'UI',
  'QA',
  'Good first issue',
  'Help wanted',
  'Blocking',
  'Production',
  'Staging',
  'Development',
  'Needs Discussion',
  'Needs Review',
];

export const getKanbanProjectProperties = (registry) => {
  const options = labels.map((label) => ({
    label,
    value: `option-${uuidv4()}`,
  }));
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
    ['Start Date']: {
      name: 'Start Date',
      type: 'date',
      isPartOfFormView: true,
      description: '',
      rewardOptions: {},
      required: false,
      milestoneFields: [],
      viewConditions: [],
      payWallOptions: {},
    },
    ['Due Date']: {
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
    Status: {
      name: 'Status',
      type: 'singleSelect',
      options: [
        {
          label: 'To Do',
          value: projectStatus.todo,
        },
        {
          label: 'In Progress',
          value: projectStatus.inProgress,
        },
        {
          label: 'In Review',
          value: projectStatus.inReview,
        },
        {
          label: 'Done',
          value: projectStatus.done,
        },
      ],
      isPartOfFormView: false,
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
    Reviewer: {
      name: 'Reviewer',
      type: 'user[]',
      isPartOfFormView: true,
      description: '',
      rewardOptions: {},
      required: false,
      milestoneFields: [],
      viewConditions: [],
      payWallOptions: {},
    },
    ['Priority']: {
      name: 'Priority',
      type: 'singleSelect',
      options: [
        {
          label: 'Low',
          value: difficultyLevel.low,
        },
        {
          label: 'Medium',
          value: difficultyLevel.medium,
        },
        {
          label: 'High',
          value: difficultyLevel.high,
        },
        {
          label: 'Urgent',
          value: difficultyLevel.urgent,
        },
      ],
      isPartOfFormView: false,
    },
    ['Label']: {
      name: 'Label',
      type: 'multiSelect',
      isPartOfFormView: true,
      description: '',
      options: options,
      rewardOptions: {},
      required: false,
      milestoneFields: [],
      viewConditions: [],
      payWallOptions: {},
    },
    ['Reward']: {
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
  } as unknown as MappedItem<Property>;
  return props;
};

export const kanbanProjectPropertyOrder = [
  'Title',
  'Description',
  'Status',
  'Assignee',
  'Reviewer',
  'Priority',
  'Label',
  'Start Date',
  'Due Date',
  'Reward',
];

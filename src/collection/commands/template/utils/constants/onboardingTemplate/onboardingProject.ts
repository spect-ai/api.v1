import { Property } from 'src/collection/types/types';
import { MappedItem } from 'src/common/interfaces';
import { v4 as uuidv4 } from 'uuid';

export const projectStatus = {
  todo: uuidv4(),
  inProgress: uuidv4(),
  done: uuidv4(),
};

export const difficultyLevel = {
  easy: uuidv4(),
  medium: uuidv4(),
  hard: uuidv4(),
};

export const onboardingProjectProperties = {
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
        value: projectStatus.todo,
      },
      {
        label: 'In Progress',
        value: projectStatus.inProgress,
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
  ['Difficulty Level']: {
    name: 'Difficulty Level',
    type: 'singleSelect',
    options: [
      {
        label: 'Easy',
        value: difficultyLevel.easy,
      },
      {
        label: 'Medium',
        value: difficultyLevel.medium,
      },
      {
        label: 'Hard',
        value: difficultyLevel.hard,
      },
    ],
    isPartOfFormView: false,
  },
  ['Label']: {
    name: 'Label',
    type: 'multiSelect',
    isPartOfFormView: true,
    description: '',
    options: [
      {
        label: 'Intro to Organization',
        value: `option-${uuidv4()}`,
      },
      {
        label: 'Product',
        value: `option-${uuidv4()}`,
      },
      {
        label: 'Community',
        value: `option-${uuidv4()}`,
      },
      {
        label: 'Marketing',
        value: `option-${uuidv4()}`,
      },
      {
        label: 'Engineering',
        value: `option-${uuidv4()}`,
      },
      {
        label: 'Design',
        value: `option-${uuidv4()}`,
      },
      {
        label: 'Finance',
        value: `option-${uuidv4()}`,
      },
      {
        label: 'Legal',
        value: `option-${uuidv4()}`,
      },
      {
        label: 'Community',
        value: `option-${uuidv4()}`,
      },
      {
        label: 'Other',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {},
    required: true,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
} as unknown as MappedItem<Property>;

export const onboardingProjectPropertyOrder = [
  'Title',
  'Description',
  'Status',
  'Assignee',
  'Difficulty Level',
  'Label',
];

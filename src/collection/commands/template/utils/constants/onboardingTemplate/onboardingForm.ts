import { Property } from 'src/collection/types/types';
import { MappedItem } from 'src/common/interfaces';
import { v4 as uuidv4 } from 'uuid';

const submitted = uuidv4();
const accepted = uuidv4();
const rejected = uuidv4();

export const onboardingFormProperties = {
  Status: {
    name: 'Status',
    type: 'singleSelect',
    options: [
      {
        label: 'Interested',
        value: submitted,
      },
      {
        label: 'Added',
        value: accepted,
      },
      {
        label: 'Rejected',
        value: rejected,
      },
    ],
    default: {
      label: 'Interested',
      value: submitted,
    },
    isPartOfFormView: false,
    rewardOptions: {},
    description: '',
    required: false,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
  ['What should we call you?']: {
    name: 'What should we call you?',
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
  ['Why do you want to onboard to the DAO?']: {
    name: 'Why do you want to onboard to the DAO?',
    type: 'longText',
    options: [
      {
        label: 'Option 1',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {},
    description:
      'Describe how you would help in contributing to the DAO and what you would like to achieve',
    default: '',
    isPartOfFormView: true,
    required: true,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
  ['What area do you intend to be active in?']: {
    name: 'What area do you intend to be active in?',
    type: 'multiSelect',
    isPartOfFormView: true,
    description: '',
    options: [
      {
        label: 'Governance',
        value: `option-${uuidv4()}`,
      },
      {
        label: 'Community',
        value: `option-${uuidv4()}`,
      },
      {
        label: 'Marketing & BD',
        value: `option-${uuidv4()}`,
      },
      {
        label: 'Operations',
        value: `option-${uuidv4()}`,
      },
      {
        label: 'Product',
        value: `option-${uuidv4()}`,
      },
    ],
    rewardOptions: {},
    required: true,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
  ['Discord Username']: {
    name: 'Discord Username',
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
  ['Twitter']: {
    name: 'Twitter',
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
    required: false,
    milestoneFields: [],
    viewConditions: [],
    payWallOptions: {},
  },
} as unknown as MappedItem<Property>;

export const onboardingFormPropertyOrder = [
  'What should we call you?',
  'Why do you want to onboard to the DAO?',
  'Status',
  'What area do you intend to be active in?',
  'Discord Username',
  'Twitter',
];

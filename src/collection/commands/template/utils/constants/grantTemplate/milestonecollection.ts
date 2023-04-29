import { Property } from 'src/collection/types/types';
import { MappedItem } from 'src/common/interfaces';
import { v4 as uuidv4 } from 'uuid';

export const mileStoneStatus = {
  todo: uuidv4(),
  inProgress: uuidv4(),
  inReview: uuidv4(),
  done: uuidv4(),
};

export const getMilestoneProperties = (registry) => {
  const props = {
    [milestonePropertyOrder[0]]: {
      id: milestonePropertyOrder[0],
      name: 'Title',
      type: 'shortText',
      default: '',
      isPartOfFormView: true,
      immutable: true,
    },
    [milestonePropertyOrder[1]]: {
      id: milestonePropertyOrder[1],
      name: 'Description',
      type: 'longText',
      default: '',
      isPartOfFormView: true,
    },
    [milestonePropertyOrder[2]]: {
      id: milestonePropertyOrder[2],
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
          label: 'In Review',
          value: mileStoneStatus.inReview,
        },
        {
          label: 'Done',
          value: mileStoneStatus.done,
        },
      ],
      isPartOfFormView: false,
    },
    [milestonePropertyOrder[3]]: {
      id: milestonePropertyOrder[3],
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
    [milestonePropertyOrder[4]]: {
      id: milestonePropertyOrder[4],
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
    [milestonePropertyOrder[5]]: {
      id: milestonePropertyOrder[5],
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
    [milestonePropertyOrder[6]]: {
      id: milestonePropertyOrder[6],
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
  uuidv4(),
  uuidv4(),
  uuidv4(),
  uuidv4(),
  uuidv4(),
];

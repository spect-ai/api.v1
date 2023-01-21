import { v4 as uuidv4 } from 'uuid';

import { labels } from './cardDetails';
export const onboardToSpectStatus = {
  toDo: uuidv4(),
  inProgress: uuidv4(),
  done: uuidv4(),
};

export const getProperties = () => {
  return {
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
          value: onboardToSpectStatus.toDo,
        },
        {
          label: 'In Progress',
          value: onboardToSpectStatus.inProgress,
        },
        {
          label: 'Done',
          value: onboardToSpectStatus.done,
        },
      ],
      isPartOfFormView: false,
      rewardOptions: {},
      description: '',
      default: {
        label: 'To Do',
        value: onboardToSpectStatus.toDo,
      },
      required: false,
      milestoneFields: [],
      viewConditions: [],
      payWallOptions: {},
    },
    Labels: {
      name: 'Labels',
      type: 'multiSelect',
      isPartOfFormView: true,
      description: '',
      options: [
        {
          label: 'Feature',
          value: labels.feature,
        },
        {
          label: 'Workflow',
          value: labels.workflow,
        },
        {
          label: 'Setup',
          value: labels.setup,
        },
        {
          label: 'Video',
          value: labels.video,
        },
        {
          label: 'Guide',
          value: labels.guide,
        },
      ],
      rewardOptions: {},
      required: false,
      milestoneFields: [],
      viewConditions: [],
      payWallOptions: {},
    },
  };
};

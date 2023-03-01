import { v4 as uuidv4 } from 'uuid';

import { labels } from './cardDetails';
export const onboardToSpectStatus = {
  beginner: uuidv4(),
  intermediate: uuidv4(),
  advanced: uuidv4(),
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
          value: onboardToSpectStatus.beginner,
        },
        {
          label: 'In Progress',
          value: onboardToSpectStatus.intermediate,
        },
        {
          label: 'Done',
          value: onboardToSpectStatus.advanced,
        },
      ],
      isPartOfFormView: false,
      rewardOptions: {},
      description: '',
      default: {
        label: 'To Do',
        value: onboardToSpectStatus.beginner,
      },
      required: false,
      milestoneFields: [],
      viewConditions: [],
      payWallOptions: {},
    },
    // Labels: {
    //   name: 'Labels',
    //   type: 'multiSelect',
    //   isPartOfFormView: true,
    //   description: '',
    //   options: [
    //     {
    //       label: 'Feature',
    //       value: labels.feature,
    //     },
    //     {
    //       label: 'Workflow',
    //       value: labels.workflow,
    //     },
    //     {
    //       label: 'Setup',
    //       value: labels.setup,
    //     },
    //     {
    //       label: 'Video',
    //       value: labels.video,
    //     },
    //     {
    //       label: 'Guide',
    //       value: labels.guide,
    //     },
    //   ],
    //   rewardOptions: {},
    //   required: false,
    //   milestoneFields: [],
    //   viewConditions: [],
    //   payWallOptions: {},
    // },
  };
};

import { v4 as uuidv4 } from 'uuid';

export const onboardToSpectStatus = {
  beginner: uuidv4(),
  intermediate: uuidv4(),
  advanced: uuidv4(),
};

export const getProperties = () => {
  return {
    'What is your name?': {
      name: 'What is your name?',
      type: 'shortText',
      default: '',
      isPartOfFormView: true,
      immutable: true,
    },
    'Why do you want to join our team?': {
      name: 'Why do you want to join our team?',
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

import { v4 as uuidv4 } from 'uuid';

export const onboardToSpectStatus = {
  beginner: uuidv4(),
  intermediate: uuidv4(),
  advanced: uuidv4(),
};

export const propertyOrder = [uuidv4(), uuidv4(), uuidv4()];

export const getProperties = () => {
  return {
    [propertyOrder[0]]: {
      id: propertyOrder[0],
      name: 'What is your name?',
      type: 'shortText',
      default: '',
      isPartOfFormView: true,
    },
    [propertyOrder[1]]: {
      id: propertyOrder[1],
      name: 'Why do you want to join our team?',
      type: 'longText',
      default: '',
      isPartOfFormView: true,
    },
    [propertyOrder[2]]: {
      id: propertyOrder[2],
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
  };
};

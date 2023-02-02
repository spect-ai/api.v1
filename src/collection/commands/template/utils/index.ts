import { Circle } from 'src/circle/model/circle.model';
import { Registry } from 'src/registry/model/registry.model';
import { v4 as uuidv4 } from 'uuid';
import {
  getGrantApplicationFormProperties,
  grantApplicationFormPropertyOrder,
} from './constants/grantTemplate/grantApplicationForm';
import {
  getGranteeCollectionProperties,
  granteeCollectionPropertyOrder,
} from './constants/grantTemplate/granteecollection';
import {
  getMilestoneProperties,
  milestonePropertyOrder,
} from './constants/grantTemplate/milestonecollection';
import {
  getKanbanProjectProperties,
  kanbanProjectPropertyOrder,
} from './constants/kanbanTemplate/kanbanProject';
import {
  onboardingFormProperties,
  onboardingFormPropertyOrder,
} from './constants/onboardingTemplate/onboardingForm';
import {
  onboardingProjectProperties,
  onboardingProjectPropertyOrder,
} from './constants/onboardingTemplate/onboardingProject';

const defaultViewId = '0x0';

const getDefaultPermissions = (circle: Circle) => {
  const defaultPermissions = {
    manageSettings: [],
    updateResponsesManually: [],
    viewResponses: [],
    addComments: [],
  };

  Object.keys(circle.roles).map((role) => {
    if (circle.roles[role].permissions.createNewForm) {
      defaultPermissions.manageSettings.push(role);
      defaultPermissions.updateResponsesManually.push(role);
      defaultPermissions.viewResponses.push(role);
      defaultPermissions.addComments.push(role);
    }
  });

  return defaultPermissions;
};

export const getGrantApplicationFormDetails = (
  circle: Circle,
  registry: {
    [k: string]: Registry;
  },
) => {
  const formPermissions = getDefaultPermissions(circle);
  const onboardingFormDetails = {
    name: 'Application Form',
    collectionType: 0,
    description: ' ',
    properties: getGrantApplicationFormProperties(registry),
    propertyOrder: grantApplicationFormPropertyOrder,
    permissions: formPermissions,
    formMetadata: {
      active: true,
      logo: circle.avatar,
      messageOnSubmission: 'Thank you for submitting your response',
      multipleResponsesAllowed: false,
      updatingResponseAllowed: true,
      allowAnonymousResponses: false,
    },
    projectMetadata: {
      viewOrder: [defaultViewId],
      views: {
        [defaultViewId]: {
          id: defaultViewId,
          name: 'Default View',
          type: 'form',
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
      },
      cardOrders: {},
    },
  };
  return onboardingFormDetails;
};

export const getMilestoneCollectionDetails = (
  circle,
  milstoneViewId,
  registry,
) => {
  const milestoneCollectionDto = {
    name: 'Milestones',
    collectionType: 1,
    description: ' ',
    properties: getMilestoneProperties(registry),
    propertyOrder: milestonePropertyOrder,
    permissions: getDefaultPermissions(circle),
    projectMetadata: {
      views: {
        [defaultViewId]: {
          id: defaultViewId,
          name: 'Grid View',
          type: 'grid',
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
        [milstoneViewId]: {
          id: milstoneViewId,
          name: 'Milestones',
          type: 'kanban',
          groupByColumn: 'Status',
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
      },
      viewOrder: [milstoneViewId, '0x0'],
      cardOrders: {
        Status: [[], [], [], []],
      },
      payments: {
        rewardField: 'Reward',
        payeeField: 'Assignee',
      },
    },
  };
  return milestoneCollectionDto;
};

export const getGranteeCollectionDto = (circle, granteeViewId, registry) => {
  const granteeCollectionDto = {
    name: 'Grantee',
    collectionType: 1,
    description: ' ',
    properties: getGranteeCollectionProperties(registry),
    propertyOrder: granteeCollectionPropertyOrder,
    permissions: getDefaultPermissions(circle),
    projectMetadata: {
      views: {
        [defaultViewId]: {
          id: defaultViewId,
          name: 'Approved Grantees',
          type: 'grid',
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
      },
      viewOrder: ['0x0'],
      cardOrders: {
        Status: [[], [], [], []],
      },
      payments: {
        rewardField: 'Total Reward',
        payeeField: 'Assignee',
      },
    },
  };
  return granteeCollectionDto;
};

export const getOnboardingFormDetails = (circle: Circle) => {
  const formPermissions = getDefaultPermissions(circle);
  const onboardingFormDetails = {
    name: 'Contributor Onboarding Form',
    collectionType: 0,
    description: ' ',
    properties: onboardingFormProperties,
    propertyOrder: onboardingFormPropertyOrder,
    permissions: formPermissions,
    formMetadata: {
      active: true,
      logo: circle.avatar,
      messageOnSubmission: 'Thank you for submitting your response',
      multipleResponsesAllowed: false,
      updatingResponseAllowed: false,
      allowAnonymousResponses: false,
    },
    projectMetadata: {
      viewOrder: [defaultViewId],
      views: {
        [defaultViewId]: {
          id: defaultViewId,
          name: 'Default View',
          type: 'form',
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
      },
      cardOrders: {},
    },
  };
  return onboardingFormDetails;
};

export const getOnboardingTasksProjectDetails = (circle, projectViewId) => {
  return {
    name: 'Onboarding Tasks',
    collectionType: 1,
    description: ' ',
    properties: onboardingProjectProperties,
    propertyOrder: onboardingProjectPropertyOrder,
    permissions: getDefaultPermissions(circle),
    projectMetadata: {
      views: {
        [defaultViewId]: {
          id: defaultViewId,
          name: 'Grid View',
          type: 'grid',
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
        [projectViewId]: {
          id: projectViewId,
          name: 'Tasks',
          type: 'kanban',
          groupByColumn: 'Status',
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
      },
      viewOrder: [projectViewId, '0x0'],
      cardOrders: {
        Status: [[], [], [], []],
      },
    },
  };
};

export const getKanbanProjectDetails = (circle, projectViewId, registry) => {
  return {
    name: 'Tasks',
    collectionType: 1,
    description: ' ',
    properties: getKanbanProjectProperties(registry),
    propertyOrder: kanbanProjectPropertyOrder,
    permissions: getDefaultPermissions(circle),
    projectMetadata: {
      views: {
        [defaultViewId]: {
          id: defaultViewId,
          name: 'Grid View',
          type: 'grid',
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
        [projectViewId]: {
          id: projectViewId,
          name: 'Tasks',
          type: 'kanban',
          groupByColumn: 'Status',
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
      },
      viewOrder: [projectViewId, '0x0'],
      cardOrders: {
        Status: [[], [], [], []],
      },
      payments: {
        rewardField: 'Reward',
        payeeField: 'Assignee',
      },
    },
  };
};

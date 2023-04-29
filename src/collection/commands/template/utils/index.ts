import { Circle } from 'src/circle/model/circle.model';
import { Registry } from 'src/registry/model/registry.model';
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
import { Permissions } from 'src/collection/types/types';

const defaultViewId = '0x0';

const getDefaultPermissions = (circle: Circle): Permissions => {
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
  return {
    name: 'Application Form',
    collectionType: 0,
    description: ' ',
    properties: getGrantApplicationFormProperties(registry),
    propertyOrder: grantApplicationFormPropertyOrder,
    permissions: getDefaultPermissions(circle),
    formMetadata: {
      active: true,
      logo: circle.avatar,
      messageOnSubmission: 'Thank you for submitting your response',
      multipleResponsesAllowed: false,
      updatingResponseAllowed: true,
      allowAnonymousResponses: false,
      walletConnectionRequired: true,
      pages: {
        ['start']: {
          id: 'start',
          name: 'Welcome Page',
          properties: [],
        },
        ['connect']: {
          id: 'connect',
          name: 'Connect Wallet',
          properties: [],
        },
        'page-1': {
          id: 'page-1',
          name: 'Project',
          properties: [
            grantApplicationFormPropertyOrder[0],
            grantApplicationFormPropertyOrder[1],
            grantApplicationFormPropertyOrder[2],
          ],
          movable: true,
        },
        'page-2': {
          id: 'page-2',
          name: 'Team Info',
          properties: [
            grantApplicationFormPropertyOrder[3],
            grantApplicationFormPropertyOrder[4],
            grantApplicationFormPropertyOrder[5],
          ],
          movable: true,
        },
        'page-3': {
          id: 'page-3',
          name: 'Grant Details',
          properties: [
            grantApplicationFormPropertyOrder[6],
            grantApplicationFormPropertyOrder[7],
          ],
          movable: true,
        },
        ['submitted']: {
          id: 'submitted',
          name: 'Submitted',
          properties: [],
        },
      },
      pageOrder: [
        'start',
        'connect',
        'page-1',
        'page-2',
        'page-3',
        'submitted',
      ],
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
          groupByColumn: milestonePropertyOrder[2],
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
      },
      viewOrder: [milstoneViewId, '0x0'],
      cardOrders: {
        [milestonePropertyOrder[2]]: [[], [], [], []],
      },
      payments: {
        rewardField: [milestonePropertyOrder[3]],
        payeeField: [milestonePropertyOrder[6]],
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
      payments: {
        rewardField: granteeCollectionPropertyOrder[5],
        payeeField: granteeCollectionPropertyOrder[7],
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
      walletConnectionRequired: true,
      pages: {
        ['start']: {
          id: 'start',
          name: 'Welcome Page',
          properties: [],
        },
        ['connect']: {
          id: 'connect',
          name: 'Connect Wallet',
          properties: [],
        },
        'page-1': {
          id: 'page-1',
          name: 'Onboarding',
          properties: [
            'What should we call you?',
            'Why do you want to onboard to the DAO?',
            'Status',
          ],
          movable: true,
        },
        'page-2': {
          id: 'page-2',
          name: 'Contact Info',
          properties: [
            'What area do you intend to be active in?',
            'Connect Discord',
            'Twitter',
          ],
          movable: true,
        },
        ['submitted']: {
          id: 'submitted',
          name: 'Submitted',
          properties: [],
        },
      },
      pageOrder: ['start', 'connect', 'page-1', 'page-2', 'submitted'],
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

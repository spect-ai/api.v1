import { Circle } from 'src/circle/model/circle.model';
import {
  granteeCollectionProperties,
  granteeCollectionPropertyOrder,
} from './granteecollection';
import {
  milestoneProperties,
  milestonePropertyOrder,
} from './milestonecollection';
import {
  onboardingFormProperties,
  onboardingFormPropertyOrder,
} from './onboardingForm';
import { v4 as uuidv4 } from 'uuid';

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

export const getOnboardingFormDetails = (
  circle: Circle,
  snapshot?: any,
  permissions?: string[],
) => {
  const formPermissions = permissions
    ? { ...getDefaultPermissions(circle), viewResponses: permissions }
    : getDefaultPermissions(circle);
  const voting = snapshot
    ? {
        enabled: true,
        options: [
          {
            label: 'For',
            value: `option-${uuidv4()}`,
          },
          {
            label: 'Against',
            value: `option-${uuidv4()}`,
          },
          {
            label: 'Abstain',
            value: `option-${uuidv4()}`,
          },
        ],
        message: 'Please Vote',
        votingType: {
          label: 'Single Choice',
          value: 'singleChoice',
        },
        votesArePublic: true,
        votesAreWeightedByTokens: true,
        snapshot,
      }
    : {};
  const onboardingFormDetails = {
    name: 'Grants Onboarding Form',
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
    voting,
  };
  return onboardingFormDetails;
};

export const getMilestoneCollectionDetails = (circle, milstoneViewId) => {
  const milestoneCollectionDto = {
    name: 'Milestones',
    collectionType: 1,
    description: ' ',
    properties: milestoneProperties,
    propertyOrder: milestonePropertyOrder,
    permissions: getDefaultPermissions(circle),
    projectMetadata: {
      views: {
        [defaultViewId]: {
          id: defaultViewId,
          name: 'Default View',
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
    },
  };
  return milestoneCollectionDto;
};

export const getGranteeCollectionDto = (circle, granteeViewId) => {
  const granteeCollectionDto = {
    name: 'Grantee',
    collectionType: 1,
    description: ' ',
    properties: granteeCollectionProperties,
    propertyOrder: granteeCollectionPropertyOrder,
    permissions: getDefaultPermissions(circle),
    projectMetadata: {
      views: {
        [defaultViewId]: {
          id: defaultViewId,
          name: 'Default View',
          type: 'grid',
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
        [granteeViewId]: {
          id: granteeViewId,
          name: 'Status View',
          type: 'kanban',
          groupByColumn: 'Status',
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
      },
      viewOrder: [granteeViewId, '0x0'],
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

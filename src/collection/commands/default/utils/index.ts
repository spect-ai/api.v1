import { v4 as uuidv4 } from 'uuid';
import {
  getOnboardToSpectActivityOrder,
  getOnboardToSpectDataActivity,
} from './constants/activityDetails';
import {
  cardSlugs,
  getDataOwners,
  getOnboardToSpectData,
} from './constants/cardDetails';
import { getProperties } from './constants/propertyDetails';

const viewId = uuidv4();

export const getOnboardToSpectProjectDetails = (caller: string) => {
  return {
    name: 'Onboard to Spect',
    properties: getProperties(),
    propertyOrder: ['Title', 'Description', 'Status', 'Labels'],
    permissions: {
      manageSettings: ['steward'],
      updateResponsesManually: ['steward'],
      viewResponses: ['steward'],
      addComments: ['steward'],
    },
    defaultView: 'table',
    circleRolesToNotifyUponNewResponse: [],
    circleRolesToNotifyUponUpdatedResponse: [],
    voting: {
      enabled: false,
    },
    collectionType: 1,
    projectMetadata: {
      views: {
        '0x0': {
          id: '0x0',
          name: 'Default View',
          type: 'grid',
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
        [viewId]: {
          name: 'Tutorials',
          type: 'kanban',
          groupByColumn: 'Status',
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
      },
      viewOrder: [viewId, '0x0'],
      cardOrders: {
        Status: [
          [],
          [
            cardSlugs.card1,
            cardSlugs.card9,
            cardSlugs.card6,
            cardSlugs.card5,
            cardSlugs.card2,
          ],
          [cardSlugs.card8, cardSlugs.card10, cardSlugs.card11],
          [cardSlugs.card3, cardSlugs.card4],
        ],
      },
      payments: {},
    },
    archived: false,
    data: getOnboardToSpectData(),
    dataOwner: getDataOwners(caller),
    dataActivities: getOnboardToSpectDataActivity(caller),
    dataActivityOrder: getOnboardToSpectActivityOrder(),
  };
};

export const getOnboardToSpectFormDetails = (caller: string) => {
  return {
    name: 'Your First Form on Spect',
    properties: getProperties(),
    propertyOrder: [
      'What is your name?',
      'Why do you want to join our team?',
      'Status',
    ],
    permissions: {
      manageSettings: ['steward'],
      updateResponsesManually: ['steward'],
      viewResponses: ['steward'],
      addComments: ['steward'],
    },
    defaultView: 'table',
    circleRolesToNotifyUponNewResponse: [],
    circleRolesToNotifyUponUpdatedResponse: [],
    voting: {
      enabled: false,
    },
    collectionType: 0,
    projectMetadata: {
      views: {
        '0x0': {
          id: '0x0',
          name: 'Default View',
          type: 'form',
          filters: [],
          sort: {
            property: '',
            direction: 'asc',
          },
        },
      },
      viewOrder: ['0x0'],
    },
    formMetadata: {
      active: true,
      messageOnSubmission: 'Thank you for submitting your response',
      multipleResponsesAllowed: false,
      updatingResponseAllowed: false,
      allowAnonymousResponses: false,
      walletConnectionRequired: true,
    },
    archived: false,
  };
};

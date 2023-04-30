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
import { getProperties, propertyOrder } from './constants/propertyDetails';
import { Collection } from 'src/collection/model/collection.model';

const viewId = uuidv4();

export const getOnboardToSpectProjectDetails = (
  caller: string,
): Partial<Collection> => {
  return {
    name: 'Onboard to Spect',
    properties: getProperties() as any,
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
      votingType: {
        label: '',
        value: '',
      },
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
          id: viewId,
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
    },
    archived: false,
    data: getOnboardToSpectData(),
    dataOwner: getDataOwners(caller),
    dataActivities: getOnboardToSpectDataActivity(caller),
    dataActivityOrder: getOnboardToSpectActivityOrder(),
  };
};

export const getOnboardToSpectFormDetails = (
  caller: string,
): Partial<Collection> => {
  return {
    name: 'Your First Form on Spect',
    properties: getProperties() as any,
    propertyOrder: propertyOrder,
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
      votingType: {
        label: '',
        value: '',
      },
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
      cardOrders: {},
    },
    formMetadata: {
      active: true,
      messageOnSubmission: 'Thank you for submitting your response',
      multipleResponsesAllowed: false,
      updatingResponseAllowed: false,
      allowAnonymousResponses: true,
      walletConnectionRequired: false,
      pages: {
        start: {
          id: 'start',
          name: 'Welcome Page',
          properties: [],
        },
        'page-1': {
          id: 'page-1',
          name: 'Page 1',
          properties: propertyOrder,
          movable: true,
        },
        submitted: {
          id: 'submitted',
          name: 'Submitted',
          properties: [],
        },
      },
      pageOrder: ['start', 'page-1', 'submitted'],
    },
    archived: false,
  };
};

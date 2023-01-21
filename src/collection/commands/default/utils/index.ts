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
          name: 'Kanban',
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
        Status: [[], [...Object.values(cardSlugs)], [], []],
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
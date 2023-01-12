import { applicationFormStatus } from '../grantApplicationForm';
import {
  getGranteeCollectionProperties,
  granteeCollectionPropertyOrder,
  granteeStatus,
} from '../granteecollection';

export const automationForAcceptedGrants = (
  triggerSlug,
  granteeId,
  granteeSlug,
  registry,
) => {
  const automation = {
    name: 'Accepted Grants',
    description: '',
    trigger: {
      id: 'dataChange',
      type: 'dataChange',
      subType: 'singleSelect',
      name: '"Status" changes',
      data: {
        fieldName: 'Status',
        fieldType: 'singleSelect',
        to: [
          {
            label: 'Accepted',
            value: applicationFormStatus.accepted,
          },
        ],
        from: [
          {
            label: 'Submitted',
            value: applicationFormStatus.submitted,
          },
        ],
      },
      service: 'collection',
    },
    actions: [
      {
        id: 'createCard',
        name: 'Create Card',
        service: 'collection',
        type: 'createCard',
        data: {
          selectedCollection: {
            label: 'Grantee',
            value: granteeId,
            data: {
              name: 'Grantee',
              slug: granteeSlug,
              properties: getGranteeCollectionProperties(registry),
              propertyOrder: granteeCollectionPropertyOrder,
              collectionType: 1,
              id: granteeId,
            },
          },
          values: [
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Title',
                  value: 'Title',
                  data: {
                    type: 'shortText',
                  },
                },
                from: {
                  label: 'Project Name',
                  value: 'Project Name',
                },
              },
            },
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Description',
                  value: 'Description',
                  data: {
                    type: 'longText',
                  },
                },
                from: {
                  label: 'About your Project',
                  value: 'About your Project',
                },
              },
            },
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Team Info',
                  value: 'Team Info',
                  data: {
                    type: 'longText',
                  },
                },
                from: {
                  label: 'About the Team',
                  value: 'About the Team',
                },
              },
            },
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Email',
                  value: 'Email',
                  data: {
                    type: 'email',
                  },
                },
                from: {
                  label: 'Email',
                  value: 'Email',
                },
              },
            },
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Total Reward',
                  value: 'Total Reward',
                  data: {
                    type: 'reward',
                  },
                },
                from: {
                  label: 'Total Reward',
                  value: 'Total Reward',
                },
              },
            },
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Milestones',
                  value: 'Milestones',
                  data: {
                    type: 'milestone',
                  },
                },
                from: {
                  label: 'Milestones',
                  value: 'Milestones',
                },
              },
            },
            {
              type: 'responder',
              mapping: {
                to: {
                  label: 'Assignee',
                  value: 'Assignee',
                  data: {
                    type: 'user[]',
                  },
                },
              },
            },
            {
              type: 'default',
              default: {
                field: {
                  label: 'Status',
                  value: 'Status',
                  data: {
                    type: 'singleSelect',
                  },
                },
                value: {
                  label: 'In Progress',
                  value: granteeStatus.inProgress,
                },
              },
            },
          ],
        },
      },
    ],
    conditions: [],
    triggerCategory: 'collection',
    triggerCollectionSlug: triggerSlug,
  };
  return automation;
};

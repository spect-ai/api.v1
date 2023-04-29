import {
  applicationFormStatus,
  grantApplicationFormPropertyOrder,
} from '../grantApplicationForm';
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
        fieldName: grantApplicationFormPropertyOrder[0],
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
                  value: granteeCollectionPropertyOrder[0],
                  data: {
                    type: 'shortText',
                  },
                },
                from: {
                  label: 'Project Name',
                  value: grantApplicationFormPropertyOrder[1],
                },
              },
            },
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Description',
                  value: granteeCollectionPropertyOrder[1],
                  data: {
                    type: 'longText',
                  },
                },
                from: {
                  label: 'About your Project',
                  value: grantApplicationFormPropertyOrder[2],
                },
              },
            },
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Team Info',
                  value: granteeCollectionPropertyOrder[6],
                  data: {
                    type: 'longText',
                  },
                },
                from: {
                  label: 'About the Team',
                  value: grantApplicationFormPropertyOrder[5],
                },
              },
            },
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Email',
                  value: granteeCollectionPropertyOrder[3],
                  data: {
                    type: 'email',
                  },
                },
                from: {
                  label: 'Email',
                  value: grantApplicationFormPropertyOrder[3],
                },
              },
            },
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Total Reward',
                  value: granteeCollectionPropertyOrder[5],
                  data: {
                    type: 'reward',
                  },
                },
                from: {
                  label: 'Total Reward',
                  value: grantApplicationFormPropertyOrder[6],
                },
              },
            },
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Milestones',
                  value: granteeCollectionPropertyOrder[4],
                  data: {
                    type: 'milestone',
                  },
                },
                from: {
                  label: 'Milestones',
                  value: grantApplicationFormPropertyOrder[4],
                },
              },
            },
            {
              type: 'responder',
              mapping: {
                to: {
                  label: 'Assignee',
                  value: granteeCollectionPropertyOrder[7],
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
                  value: granteeCollectionPropertyOrder[2],
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

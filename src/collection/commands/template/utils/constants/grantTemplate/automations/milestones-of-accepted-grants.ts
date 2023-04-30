import {
  applicationFormStatus,
  grantApplicationFormPropertyOrder,
} from '../grantApplicationForm';
import {
  getMilestoneProperties,
  milestonePropertyOrder,
  mileStoneStatus,
} from '../milestonecollection';

export const automationForMilestonesOfAcceptedGrants = (
  milestoneId: string,
  milestoneSlug: string,
  registry: string,
  triggerSlug: string,
) => {
  const automation = {
    name: 'Milestones of Accepted Grants',
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
            label: 'Milestones',
            value: milestoneId,
            data: {
              name: 'Milestones',
              slug: milestoneSlug,
              properties: getMilestoneProperties(registry),
              propertyOrder: milestonePropertyOrder,
              collectionType: 1,
              id: milestoneId,
            },
          },
          values: [
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Title',
                  value: milestonePropertyOrder[0],
                  data: {
                    type: 'shortText',
                  },
                },
                from: {
                  label: 'Milestones title',
                  value: grantApplicationFormPropertyOrder[4],
                  data: {
                    type: 'shortText',
                    fieldType: 'milestone',
                    fieldName: grantApplicationFormPropertyOrder[4],
                    subFieldName: 'title',
                  },
                },
              },
            },
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Description',
                  value: milestonePropertyOrder[1],
                  data: {
                    type: 'longText',
                  },
                },
                from: {
                  label: 'Milestones description',
                  value: grantApplicationFormPropertyOrder[4],
                  data: {
                    type: 'longText',
                    fieldType: 'milestone',
                    fieldName: grantApplicationFormPropertyOrder[4],
                    subFieldName: 'description',
                  },
                },
              },
            },
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Due Date',
                  value: milestonePropertyOrder[4],
                  data: {
                    type: 'date',
                  },
                },
                from: {
                  label: 'Milestones date',
                  value: grantApplicationFormPropertyOrder[4],
                  data: {
                    type: 'date',
                    fieldType: 'milestone',
                    fieldName: grantApplicationFormPropertyOrder[4],
                    subFieldName: 'dueDate',
                  },
                },
              },
            },
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Reward',
                  value: milestonePropertyOrder[3],
                  data: {
                    type: 'reward',
                  },
                },
                from: {
                  label: 'Milestones reward',
                  value: grantApplicationFormPropertyOrder[4],
                  data: {
                    type: 'reward',
                    fieldType: 'milestone',
                    fieldName: grantApplicationFormPropertyOrder[4],
                    subFieldName: 'reward',
                  },
                },
              },
            },
            {
              type: 'mapping',
              mapping: {
                to: {
                  label: 'Project Name',
                  value: milestonePropertyOrder[5],
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
              type: 'responder',
              mapping: {
                to: {
                  label: 'Assignee',
                  value: milestonePropertyOrder[6],
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
                  value: milestonePropertyOrder[2],
                  data: {
                    type: 'singleSelect',
                  },
                },
                value: {
                  label: 'To Do',
                  value: mileStoneStatus.todo,
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

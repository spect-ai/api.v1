import { applicationFormStatus } from '../grantApplicationForm';
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
                  value: 'Title',
                  data: {
                    type: 'shortText',
                  },
                },
                from: {
                  label: 'Milestones title',
                  value: 'Milestones.title',
                  data: {
                    type: 'shortText',
                    fieldType: 'milestone',
                    fieldName: 'Milestones',
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
                  value: 'Description',
                  data: {
                    type: 'longText',
                  },
                },
                from: {
                  label: 'Milestones description',
                  value: 'Milestones.description',
                  data: {
                    type: 'longText',
                    fieldType: 'milestone',
                    fieldName: 'Milestones',
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
                  value: 'Due Date',
                  data: {
                    type: 'date',
                  },
                },
                from: {
                  label: 'Milestones date',
                  value: 'Milestones.date',
                  data: {
                    type: 'date',
                    fieldType: 'milestone',
                    fieldName: 'Milestones',
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
                  value: 'Reward',
                  data: {
                    type: 'reward',
                  },
                },
                from: {
                  label: 'Milestones reward',
                  value: 'Milestones.reward',
                  data: {
                    type: 'reward',
                    fieldType: 'milestone',
                    fieldName: 'Milestones',
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
                  value: 'Project Name',
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

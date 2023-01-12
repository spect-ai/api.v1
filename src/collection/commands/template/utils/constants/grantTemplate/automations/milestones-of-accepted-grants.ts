import { applicationFormStatus } from '../grantApplicationForm';
import { mileStoneStatus } from '../milestonecollection';

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
              properties: {
                Title: {
                  name: 'Title',
                  type: 'shortText',
                  default: '',
                  isPartOfFormView: true,
                  immutable: true,
                },
                Description: {
                  name: 'Description',
                  type: 'longText',
                  default: '',
                  isPartOfFormView: true,
                },
                'Project Name': {
                  name: 'Project Name',
                  type: 'shortText',
                  isPartOfFormView: true,
                  description: '',
                  rewardOptions: {},
                  required: false,
                  milestoneFields: [],
                  viewConditions: [],
                  payWallOptions: {},
                },
                Status: {
                  name: 'Status',
                  type: 'singleSelect',
                  options: [
                    {
                      label: 'To Do',
                      value: mileStoneStatus.todo,
                    },
                    {
                      label: 'In Progress',
                      value: mileStoneStatus.inProgress,
                    },
                    {
                      label: 'Done',
                      value: mileStoneStatus.done,
                    },
                  ],
                  isPartOfFormView: false,
                },
                Reward: {
                  name: 'Reward',
                  type: 'reward',
                  isPartOfFormView: true,
                  description: '',
                  rewardOptions: registry,
                  required: false,
                  milestoneFields: [],
                  viewConditions: [],
                  payWallOptions: {},
                },
                'Due Date': {
                  name: 'Due Date',
                  type: 'date',
                  isPartOfFormView: true,
                  description: '',
                  options: [],
                  rewardOptions: {},
                  required: false,
                  milestoneFields: [],
                  viewConditions: [],
                  payWallOptions: {},
                },
              },
              propertyOrder: [
                'Title',
                'Description',
                'Status',
                'Reward',
                'Due Date',
                'Project Name',
              ],
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

import { applicationFormStatus } from '../grantApplicationForm';
import { granteeStatus } from '../granteecollection';

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
                Status: {
                  name: 'Status',
                  type: 'singleSelect',
                  options: [
                    {
                      label: 'In Progress',
                      value: granteeStatus.inProgress,
                    },
                    {
                      label: 'Completed',
                      value: granteeStatus.completed,
                    },
                    {
                      label: 'Churned',
                      value: granteeStatus.churned,
                    },
                  ],
                  isPartOfFormView: false,
                },
                Email: {
                  name: 'Email',
                  type: 'email',
                  isPartOfFormView: true,
                  description: '',
                  rewardOptions: {},
                  required: false,
                  milestoneFields: [],
                  viewConditions: [],
                  payWallOptions: {},
                },
                Milestones: {
                  name: 'Milestones',
                  type: 'milestone',
                  isPartOfFormView: true,
                  description: '',
                  rewardOptions: registry,
                  required: false,
                  milestoneFields: ['name', 'description', 'dueDate', 'reward'],
                  viewConditions: [],
                  payWallOptions: {},
                },
                'Total Reward': {
                  name: 'Total Reward',
                  type: 'reward',
                  isPartOfFormView: true,
                  description: '',
                  rewardOptions: registry,
                  required: false,
                  milestoneFields: [],
                  viewConditions: [],
                  payWallOptions: {},
                },
                'Team Info': {
                  name: 'Team Info',
                  type: 'longText',
                  isPartOfFormView: true,
                  description: '',
                  rewardOptions: {},
                  required: false,
                  milestoneFields: [],
                  viewConditions: [],
                  payWallOptions: {},
                },
                Assignee: {
                  name: 'Assignee',
                  type: 'user[]',
                  isPartOfFormView: true,
                  description: '',
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
                'Email',
                'Milestones',
                'Total Reward',
                'Team Info',
                'Assignee',
              ],
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

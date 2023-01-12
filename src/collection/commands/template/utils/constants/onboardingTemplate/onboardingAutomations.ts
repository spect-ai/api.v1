import { Collection } from 'src/collection/model/collection.model';
import { onboardingStatus } from './onboardingForm';

export function getOnboardingflowAutomations(
  circleId: string,
  projectDTO: Collection,
  triggerSlug: string,
  discordRoles?: {
    [key: string]: boolean;
  },
) {
  const dicordRoleAction =
    discordRoles && Object.keys(discordRoles).length > 0
      ? {
          id: 'giveDiscordRole',
          name: 'Give Discord Role',
          service: 'circle',
          type: 'giveDiscordRole',
          data: {
            roles: discordRoles,
            circleId: circleId,
          },
        }
      : {};
  const automations = [
    {
      name: 'Give Roles',
      description: 'Give roles in the org to the selected contributors',
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
              label: 'Added',
              value: onboardingStatus.added,
            },
          ],
          from: [
            {
              label: 'Interested',
              value: onboardingStatus.interested,
            },
          ],
        },
        service: 'collection',
      },
      actions: [
        {
          id: 'giveRole',
          name: 'Give Circle Role',
          service: 'circle',
          type: 'giveRole',
          data: {
            roles: {
              member: true,
            },
            circleId: circleId,
          },
        },
      ],
      conditions: [],
      triggerCategory: 'collection',
      triggerCollectionSlug: triggerSlug,
    },
    {
      name: 'Read Manifesto Card',
      description: 'Onboarding Tasks for new contributors',
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
              label: 'Added',
              value: onboardingStatus.added,
            },
          ],
          from: [
            {
              label: 'Interested',
              value: onboardingStatus.interested,
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
              label: 'Onboarding Tasks',
              value: projectDTO.id,
              data: {
                name: projectDTO.name,
                slug: projectDTO.slug,
                properties: projectDTO.properties,
                propertyOrder: projectDTO.propertyOrder,
                collectionType: 1,
                id: projectDTO.id,
              },
            },
            values: [
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
                    label: 'Title',
                    value: 'Title',
                    data: {
                      type: 'shortText',
                    },
                  },
                  value: 'Read the manifesto',
                },
              },
              {
                type: 'default',
                default: {
                  field: {
                    label: 'Description',
                    value: 'Description',
                    data: {
                      type: 'shortText',
                    },
                  },
                  value: '<Link to Manifesto>',
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
                    label: projectDTO.properties['Status'].options[0].label,
                    value: projectDTO.properties['Status'].options[0].value,
                  },
                },
              },
              {
                type: 'default',
                default: {
                  field: {
                    label: 'Difficulty Level',
                    value: 'Difficulty Level',
                    data: {
                      type: 'singleSelect',
                    },
                  },
                  value: {
                    label:
                      projectDTO.properties['Difficulty Level'].options[0]
                        .label,
                    value:
                      projectDTO.properties['Difficulty Level'].options[0]
                        .value,
                  },
                },
              },
              {
                type: 'default',
                default: {
                  field: {
                    label: 'Label',
                    value: 'Label',
                    data: {
                      type: 'multiSelect',
                    },
                  },
                  value: [
                    {
                      label: 'Intro to Organization',
                      value: projectDTO.properties['Label'].options.find(
                        (option) => option.label === 'Intro to Organization',
                      ).value,
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
      conditions: [],
      triggerCategory: 'collection',
      triggerCollectionSlug: triggerSlug,
    },
    {
      name: 'Governance Process',
      description: 'Onboarding Tasks for new contributors',
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
              label: 'Added',
              value: onboardingStatus.added,
            },
          ],
          from: [
            {
              label: 'Interested',
              value: onboardingStatus.interested,
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
              label: 'Onboarding Tasks',
              value: projectDTO.id,
              data: {
                name: projectDTO.name,
                slug: projectDTO.slug,
                properties: projectDTO.properties,
                propertyOrder: projectDTO.propertyOrder,
                collectionType: 1,
                id: projectDTO.id,
              },
            },
            values: [
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
                    label: 'Title',
                    value: 'Title',
                    data: {
                      type: 'shortText',
                    },
                  },
                  value: 'Governance Process',
                },
              },
              {
                type: 'default',
                default: {
                  field: {
                    label: 'Description',
                    value: 'Description',
                    data: {
                      type: 'shortText',
                    },
                  },
                  value: '<Link to Process>',
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
                    label: projectDTO.properties['Status'].options[0].label,
                    value: projectDTO.properties['Status'].options[0].value,
                  },
                },
              },
              {
                type: 'default',
                default: {
                  field: {
                    label: 'Difficulty Level',
                    value: 'Difficulty Level',
                    data: {
                      type: 'singleSelect',
                    },
                  },
                  value: {
                    label:
                      projectDTO.properties['Difficulty Level'].options[0]
                        .label,
                    value:
                      projectDTO.properties['Difficulty Level'].options[0]
                        .value,
                  },
                },
              },
              {
                type: 'default',
                default: {
                  field: {
                    label: 'Label',
                    value: 'Label',
                    data: {
                      type: 'multiSelect',
                    },
                  },
                  value: [
                    {
                      label: 'Intro to Organization',
                      value: projectDTO.properties['Label'].options.find(
                        (option) => option.label === 'Intro to Organization',
                      ).value,
                    },
                    {
                      label: 'Community',
                      value: projectDTO.properties['Label'].options.find(
                        (option) => option.label === 'Community',
                      ).value,
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
      conditions: [],
      triggerCategory: 'collection',
      triggerCollectionSlug: triggerSlug,
    },
  ];

  if (discordRoles && Object.keys(discordRoles).length > 0)
    automations?.[0]?.actions.push(dicordRoleAction as any);

  return automations;
}

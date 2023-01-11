import { onboardingStatus } from './onboardingForm';

export function getGrantWorkflowAutomations(
  circleId: string,
  projectId: string,
  projectSlug: string,
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
            discordRoles,
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
  ];

  if (discordRoles && Object.keys(discordRoles).length > 0)
    automations?.[0]?.actions.push(dicordRoleAction as any);

  return automations;
}

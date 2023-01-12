import { applicationFormStatus } from '../grantApplicationForm';

export const automationOfNotificationWhenAccepted = (
  circleId: string,
  triggerSlug: string,
  roles?: {
    [key: string]: boolean;
  },
) => {
  const dicordRole =
    roles && Object.keys(roles).length > 0
      ? {
          id: 'giveDiscordRole',
          name: 'Give Discord Role',
          service: 'circle',
          type: 'giveDiscordRole',
          data: {
            roles,
            circleId: circleId,
          },
        }
      : {};
  const automation = {
    name: 'Notification on acceptance',
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
        id: 'giveRole',
        name: 'Give Circle Role',
        service: 'circle',
        type: 'giveRole',
        data: {
          roles: {
            grantee: true,
          },
          circleId: circleId,
        },
      },
      {
        id: 'sendEmail',
        name: 'Send Email',
        service: 'email',
        type: 'sendEmail',
        data: {
          toEmailProperties: ['Email'],
          circleId: circleId,
          message:
            "Bravo ! Your application has been accepted for the grants program. You will be awarded the role of a 'Grantee' in the DAO's Spect Circle.  Make sure to check it out using the button below\n",
        },
      },
    ],
    conditions: [],
    triggerCategory: 'collection',
    triggerCollectionSlug: triggerSlug,
  };

  if (roles && Object.keys(roles).length > 0)
    automation?.actions.push(dicordRole as any);

  return automation;
};

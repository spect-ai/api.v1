import {
  applicationFormStatus,
  grantApplicationFormPropertyOrder,
} from '../grantApplicationForm';

export const automationWhenRejected = (circleId, triggerSlug) => {
  const automation = {
    name: 'Rejected Grants',
    description: '',
    trigger: {
      id: 'dataChange',
      type: 'dataChange',
      subType: 'singleSelect',
      name: '"Status" changes',
      data: {
        fieldName: grantApplicationFormPropertyOrder[0],
        fieldType: 'singleSelect',
        from: [
          {
            label: 'Submitted',
            value: applicationFormStatus.submitted,
          },
        ],
        to: [
          {
            label: 'Rejected',
            value: applicationFormStatus.rejected,
          },
        ],
      },
      service: 'collection',
    },
    actions: [
      {
        id: 'sendEmail',
        name: 'Send Email',
        service: 'email',
        type: 'sendEmail',
        data: {
          toEmailProperties: ['Email'],
          circleId: circleId,
          message:
            "We're sorry to inform you that your grant application has been rejected. We wish you the best for your future endeavors. ",
        },
      },
    ],
    conditions: [],
    triggerCategory: 'collection',
    triggerCollectionSlug: triggerSlug,
  };
  return automation;
};

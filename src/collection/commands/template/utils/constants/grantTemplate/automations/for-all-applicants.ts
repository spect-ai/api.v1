export const automationAfterApplying = (circleId, triggerSlug) => {
  const automation = {
    name: 'For all Applicants',
    description: '',
    trigger: {
      id: 'newData',
      type: 'newData',
      name: 'New Response is added',
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
            applicant: true,
          },
          circleId: circleId,
        },
      },
    ],
    conditions: [],
    triggerCategory: 'collection',
    triggerCollectionSlug: triggerSlug,
  };
  return automation;
};

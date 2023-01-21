import { cardSlugs } from './cardDetails';
import { v4 as uuidv4 } from 'uuid';

const activitySlugs = Object.values(cardSlugs).map(() => {
  return uuidv4();
});

export const getOnboardToSpectDataActivity = (caller: string) => {
  const data = {};
  for (const i in Object.values(cardSlugs)) {
    data[Object.values(cardSlugs)[i]] = {
      [activitySlugs[i]]: {
        content: 'created new row',
        ref: {
          actor: {
            id: caller,
            type: 'user',
          },
        },
        timestamp: new Date().toISOString(),
        comment: false,
      },
    };
  }
  return data;
};

export const getOnboardToSpectActivityOrder = () => {
  const activityOrder = {};
  for (const i in Object.values(cardSlugs)) {
    activityOrder[Object.values(cardSlugs)[i]] = [
      Object.values(activitySlugs)[i],
    ];
  }
  return activityOrder;
};

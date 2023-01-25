import { onboardToSpectStatus } from './propertyDetails';
import { v4 as uuidv4 } from 'uuid';

export const labels = {
  feature: uuidv4(),
  workflow: uuidv4(),
  setup: uuidv4(),
  video: uuidv4(),
  guide: uuidv4(),
};

const labelOptions = {
  feature: {
    label: 'Feature',
    value: `option-${labels?.feature}`,
  },
  workflow: {
    label: 'Workflow',
    value: `option-${labels?.workflow}`,
  },
  setup: {
    label: 'Setup',
    value: `option-${labels?.setup}`,
  },
  video: {
    label: 'Video',
    value: `option-${labels?.video}`,
  },
  guide: {
    label: 'Guide',
    value: `option-${labels?.guide}`,
  },
};

const statusOptions = {
  beginner: {
    label: 'Beginner',
    value: onboardToSpectStatus?.beginner,
  },
  intermediate: {
    label: 'Intermediate',
    value: onboardToSpectStatus?.intermediate,
  },
  advanced: {
    label: 'Advanced',
    value: onboardToSpectStatus?.advanced,
  },
};

export const cardSlugs = {
  card1: uuidv4(),
  card2: uuidv4(),
  card3: uuidv4(),
  card4: uuidv4(),
  card5: uuidv4(),
  card6: uuidv4(),
  card8: uuidv4(),
  card9: uuidv4(),
  card10: uuidv4(),
  card11: uuidv4(),
};

export const getDataOwners = (caller: string) => {
  const dataOwners = {};
  for (const i in Object.values(cardSlugs)) {
    dataOwners[Object.values(cardSlugs)[i]] = caller;
  }
  return dataOwners;
};

export const getOnboardToSpectData = () => {
  return {
    [cardSlugs.card1]: {
      Title: 'Roles & Granular Permissions',
      Status: statusOptions.beginner,
      slug: cardSlugs.card1,
      Labels: [labelOptions.feature, labelOptions.guide],
      Description:
        '<https://scribehow.com/shared/Setup_Granular_Roles_and_Permissions_on_Spect__oD-6xOQPRJibypzvWW7TVQ>',
    },
    [cardSlugs.card2]: {
      Title: 'Pay using custom token & Gnosis safe',
      Status: statusOptions.beginner,
      slug: cardSlugs.card2,
      Labels: [labelOptions.setup, labelOptions.guide],
      Description:
        '<https://scribehow.com/shared/Pay_using_custom_token_and_Gnosis_Safe__sniLkX4ERoqNNFrkuTsihw>',
    },
    [cardSlugs.card3]: {
      Title: 'Run a grant program',
      Status: statusOptions.advanced,
      slug: cardSlugs.card3,
      Labels: [labelOptions.workflow, labelOptions.video, labelOptions.guide],
      Description:
        '<https://scribehow.com/shared/Create_a_Grants_Workflow_on_Spect__Of7YjSwlRhW8ZiYbjgkO3g>',
    },
    [cardSlugs.card4]: {
      Title: 'Run an onboarding program',
      Labels: [labelOptions.workflow, labelOptions.video, labelOptions.guide],
      Status: statusOptions.advanced,
      slug: cardSlugs.card4,
      Description:
        '<https://scribehow.com/shared/Run_a_onboarding_program__SxE6ihIxQzKbePZ8yVFu6A>',
    },
    [cardSlugs.card5]: {
      Title: 'Manage projects using a Kanban board',
      Labels: [labelOptions.workflow, labelOptions.video, labelOptions.guide],
      Status: statusOptions.beginner,
      slug: cardSlugs.card5,
      Description:
        '<https://scribehow.com/shared/Manage_projects_using_a_Kanban_board__OY64snbqT2ikPxsk2BH-jw>',
    },
    [cardSlugs.card6]: {
      Title: 'Create a survey form.',
      Status: statusOptions.beginner,
      Labels: [labelOptions.workflow, labelOptions.guide],
      slug: cardSlugs.card6,
      Description:
        '<https://scribehow.com/shared/Create_Communtiy_Surveys_using_Spect_Forms__SBZCZQdzTCekJNjJFamqqw>',
    },
    [cardSlugs.card8]: {
      Title: 'Automate recurring actions',
      Status: statusOptions.intermediate,
      Labels: [labelOptions.guide, labelOptions.feature],
      slug: cardSlugs.card8,
      Description:
        '<https://scribehow.com/shared/Automate_recurring_chores_on_Spect__EQ9ccqnATWeVOi_c1aY0DA>',
    },
    [cardSlugs.card9]: {
      Title: 'Embed forms on Notion',
      Status: statusOptions.beginner,
      Labels: [labelOptions.feature, labelOptions.guide],
      slug: cardSlugs.card9,
      Description:
        '<https://scribehow.com/shared/Embedding_Spect_Forms_on_Notion__NeMAX9G9QeSCjyPPTybK5A>',
    },
    [cardSlugs.card10]: {
      Title: 'Create Sybil Protected Forms',
      Status: statusOptions.intermediate,
      Labels: [labelOptions.feature, labelOptions.guide],
      slug: cardSlugs.card10,
      Description:
        '<https://scribehow.com/shared/Sybil_Resistance_on_Spect_Forms__dz3WrEwTSBOOawcr1krQHA>',
    },
    [cardSlugs.card11]: {
      Title:
        'Decentralize decision making with soft consensus & snapshot voting on Spect',
      Status: statusOptions.intermediate,
      Labels: [labelOptions.feature, labelOptions.guide],
      slug: cardSlugs.card11,
      anonymous: false,
      Description:
        '<https://scribehow.com/shared/Decentralize_decision_making_on_Spect__pCo0GYt2RPmvQ_qnoMS-eQ>',
    },
  };
};

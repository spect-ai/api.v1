import { MappedItem } from 'src/common/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { Property } from '../../../../../types/types';
import { automationWhenRejected } from './automations/rejected';
import { automationForAcceptedGrants } from './automations/accepted-grants';
import { automationForMilestonesOfAcceptedGrants } from './automations/milestones-of-accepted-grants';
import { automationOfNotificationWhenAccepted } from './automations/notification-on-acceptance';
import { automationAfterApplying } from './automations/for-all-applicants';

export const applicationFormStatus = {
  submitted: uuidv4(),
  accepted: uuidv4(),
  rejected: uuidv4(),
};

export const getGrantApplicationFormProperties = (registry) => {
  const properties = {
    Status: {
      name: 'Status',
      type: 'singleSelect',
      options: [
        {
          label: 'Submitted',
          value: applicationFormStatus.submitted,
        },
        {
          label: 'Accepted',
          value: applicationFormStatus.accepted,
        },
        {
          label: 'Rejected',
          value: applicationFormStatus.rejected,
        },
      ],
      default: {
        label: 'Submitted',
        value: applicationFormStatus.submitted,
      },
      isPartOfFormView: false,
      rewardOptions: {},
      description: '',
      required: false,
      milestoneFields: [],
      viewConditions: [],
      payWallOptions: {},
    },
    ['Project Name']: {
      name: 'Project Name',
      type: 'shortText',
      options: [
        {
          label: 'Option 1',
          value: `option-${uuidv4()}`,
        },
      ],
      rewardOptions: {},
      description: '',
      default: '',
      isPartOfFormView: true,
      required: true,
      milestoneFields: [],
      viewConditions: [],
      payWallOptions: {},
    },
    ['About your Project']: {
      name: 'About your Project',
      type: 'longText',
      options: [
        {
          label: 'Option 1',
          value: `option-${uuidv4()}`,
        },
      ],
      rewardOptions: {},
      description: '',
      default: '',
      isPartOfFormView: true,
      required: true,
      milestoneFields: [],
      viewConditions: [],
      payWallOptions: {},
    },
    Email: {
      name: 'Email',
      type: 'email',
      isPartOfFormView: true,
      description: '',
      options: [
        {
          label: 'Option 1',
          value: `option-${uuidv4()}`,
        },
      ],
      rewardOptions: {},
      required: true,
      milestoneFields: [],
      viewConditions: [],
      payWallOptions: {},
    },
    Milestones: {
      name: 'Milestones',
      type: 'milestone',
      isPartOfFormView: true,
      description:
        'Give a detailed description on the milestones you would want to achieve during this grant program',
      options: [
        {
          label: 'Option 1',
          value: `option-${uuidv4()}`,
        },
      ],
      rewardOptions: registry,
      required: true,
      milestoneFields: ['name', 'description', 'dueDate', 'reward'],
      viewConditions: [],
      payWallOptions: {},
    },
    ['About the Team']: {
      name: 'About the Team',
      type: 'longText',
      options: [
        {
          label: 'Option 1',
          value: `option-${uuidv4()}`,
        },
      ],
      rewardOptions: {},
      description: '',
      isPartOfFormView: true,
      required: false,
      milestoneFields: [],
      viewConditions: [],
      payWallOptions: {},
    },
    ['Total Reward']: {
      name: 'Total Reward',
      type: 'reward',
      isPartOfFormView: true,
      description: '',
      options: [
        {
          label: 'Option 1',
          value: `option-${uuidv4()}`,
        },
      ],
      rewardOptions: registry,
      required: true,
      milestoneFields: [],
      viewConditions: [],
      payWallOptions: {},
    },
  } as unknown as MappedItem<Property>;
  return properties;
};

export const grantApplicationFormPropertyOrder = [
  'Project Name',
  'About your Project',
  'Status',
  'About the Team',
  'Email',
  'Milestones',
  'Total Reward',
];

export function getGrantWorkflowAutomations(
  circleId: string,
  granteeId: string,
  granteeSlug: string,
  milestoneId: string,
  milestoneSlug: string,
  triggerSlug: string,
  roles?: {
    [key: string]: boolean;
  },
  registry?: any,
) {
  const automations = [
    automationForAcceptedGrants(triggerSlug, granteeId, granteeSlug, registry),
    automationForMilestonesOfAcceptedGrants(
      milestoneId,
      milestoneSlug,
      registry,
      triggerSlug,
    ),
    automationOfNotificationWhenAccepted(circleId, triggerSlug, roles),
    automationAfterApplying(circleId, triggerSlug),
    automationWhenRejected(circleId, triggerSlug),
  ];

  return automations;
}

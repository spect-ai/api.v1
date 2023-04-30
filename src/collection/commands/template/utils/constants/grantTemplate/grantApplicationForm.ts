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
    [grantApplicationFormPropertyOrder[0]]: {
      id: grantApplicationFormPropertyOrder[0],
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
    [grantApplicationFormPropertyOrder[1]]: {
      id: grantApplicationFormPropertyOrder[1],
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
    [grantApplicationFormPropertyOrder[2]]: {
      id: grantApplicationFormPropertyOrder[2],
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
    [grantApplicationFormPropertyOrder[3]]: {
      id: grantApplicationFormPropertyOrder[3],
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
    [grantApplicationFormPropertyOrder[4]]: {
      id: grantApplicationFormPropertyOrder[4],
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
    [grantApplicationFormPropertyOrder[5]]: {
      id: grantApplicationFormPropertyOrder[5],
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
    [grantApplicationFormPropertyOrder[6]]: {
      id: grantApplicationFormPropertyOrder[6],
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
    [grantApplicationFormPropertyOrder[7]]: {
      id: grantApplicationFormPropertyOrder[7],
      name: 'Connect Discord',
      type: 'discord',
      isPartOfFormView: true,
      description: 'Connect discord to get roles in the server',
      rewardOptions: {},
      required: false,
      milestoneFields: [],
      viewConditions: [],
      payWallOptions: {},
    },
  } as unknown as MappedItem<Property>;
  return properties;
};

export const grantApplicationFormPropertyOrder = Array.from({ length: 8 }, () =>
  uuidv4(),
);

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

import { CirclePermission, Roles } from './common/types/role.type';
import { CardTemplate } from './project/types/types';

export const defaultCircleCreatorRoles = ['steward'];

export const defaultCircleRoles = {
  steward: {
    name: 'steward',
    description: 'Steward role',
    selfAssignable: false,
    mutable: true,
    permissions: {
      createNewCircle: true,
      manageCircleSettings: true,
      createNewProject: true,
      manageProjectSettings: true,
      createNewRetro: true,
      endRetroManually: true,
      managePaymentOptions: true,
      makePayment: true,
      inviteMembers: true,
      manageRoles: true,
      manageMembers: true,
      distributeCredentials: true,
      manageCardProperties: {
        Task: true,
        Bounty: true,
      },
      createNewCard: {
        Task: true,
        Bounty: true,
      },
      manageRewards: {
        Task: true,
        Bounty: true,
      },
      reviewWork: {
        Task: true,
        Bounty: true,
      },
      canClaim: {
        Task: true,
        Bounty: false,
      },
    } as CirclePermission,
  },
  member: {
    name: 'member',
    description: 'Member role',
    selfAssignable: false,
    mutable: true,
    permissions: {
      createNewCircle: false,
      manageCircleSettings: false,
      createNewProject: true,
      manageProjectSettings: true,
      createNewRetro: true,
      endRetroManually: false,
      managePaymentOptions: false,
      makePayment: true,
      inviteMembers: true,
      manageRoles: false,
      manageMembers: false,
      distributeCredentials: false,
      manageCardProperties: {
        Task: true,
        Bounty: false,
      },
      createNewCard: {
        Task: true,
        Bounty: false,
      },
      manageRewards: {
        Task: true,
        Bounty: false,
      },
      reviewWork: {
        Task: true,
        Bounty: false,
      },
      canClaim: {
        Task: true,
        Bounty: false,
      },
    } as CirclePermission,
  },
  /** TODO: We need to reserve this keyword and not let users set this as role */
  applicant: {
    name: 'applicant',
    description: 'Applicant role',
    selfAssignable: false,
    mutable: false,
    permissions: {
      createNewCircle: false,
      manageCircleSettings: false,
      createNewProject: false,
      manageProjectSettings: false,
      createNewRetro: false,
      endRetroManually: false,
      managePaymentOptions: false,
      makePayment: false,
      inviteMembers: false,
      manageRoles: false,
      manageMembers: false,
      distributeCredentials: false,
      manageCardProperties: {
        Task: false,
        Bounty: false,
      },
      createNewCard: {
        Task: false,
        Bounty: false,
      },
      manageRewards: {
        Task: false,
        Bounty: false,
      },
      reviewWork: {
        Task: false,
        Bounty: false,
      },
      canClaim: {
        Task: false,
        Bounty: false,
      },
    } as CirclePermission,
  },
} as Roles;

export const predefinedTaskTemplate = {
  name: 'Task',
  properties: {
    assignee: {
      name: 'Assignee',
      type: 'user[]',
      default: [],
    },
    reviewer: {
      name: 'Reviewer',
      type: 'user[]',
      default: [],
    },
    'start-date': {
      name: 'Start Date',
      type: 'date',
      conditions: [
        {
          propertyId: 'deadline',
          condition: 'lessThanOrEqualTo',
          feedback: 'Start Date must be less than or equal to deadline',
        },
      ],
    },
    deadline: {
      name: 'Deadline',
      type: 'date',
      conditions: [
        {
          propertyId: 'start-date',
          condition: 'greaterThanOrEqualTo',
          feedback: 'Deadline must be greater than or equal to start date',
        },
      ],
    },
    priority: {
      name: 'Priority',
      type: 'singleSelect',
      default: {
        value: 0,
        label: 'None',
      },
      options: [
        {
          value: 0,
          label: 'None',
        },
        {
          value: 1,
          label: 'Low',
        },
        {
          value: 2,
          label: 'Medium',
        },
        {
          value: 3,
          label: 'High',
        },
        {
          value: 4,
          label: 'Urgent',
        },
      ],
    },
  },
  propertyOrder: ['assignee', 'reviewer', 'start-date', 'deadline', 'priority'],
} as CardTemplate;

export const predefinedBountyTemplate = {
  name: 'Bounty',
  properties: {
    assignee: {
      name: 'Assignee',
      type: 'user[]',
      default: [],
    },
    reviewer: {
      name: 'Reviewer',
      type: 'user[]',
      default: [],
    },
    deadline: {
      name: 'Deadline',
      type: 'date',
      conditions: [
        {
          propertyId: 'start-date',
          condition: 'greaterThanOrEqualTo',
          feedback: 'Deadline must be greater than or equal to start date',
        },
      ],
    },
    priority: {
      name: 'Priority',
      type: 'singleSelect',
      default: {
        value: 0,
        label: 'None',
      },
      options: [
        {
          value: 0,
          label: 'None',
        },
        {
          value: 1,
          label: 'Low',
        },
        {
          value: 2,
          label: 'Medium',
        },
        {
          value: 3,
          label: 'High',
        },
        {
          value: 4,
          label: 'Urgent',
        },
      ],
    },
    reward: {
      name: 'Reward',
      type: 'reward',
      default: {
        chain: {
          chainId: '137',
          name: 'polygon',
        },
        token: {
          address: '0x0',
          symbol: 'MATIC',
        },
        value: 0,
      },
    },
  },
  propertyOrder: ['assignee', 'reviewer', 'deadline', 'priority', 'reward'],
} as CardTemplate;

export const predefinedGrantTemplate = {
  name: 'Grant',
  properties: {
    grantee: {
      name: 'Grantee',
      type: 'user[]',
      default: [],
    },
    programLiaison: {
      name: 'Program Liaison',
      type: 'user[]',
      default: [],
    },
    approvedOn: {
      name: 'Approval Date',
      type: 'date',
    },
    completedOn: {
      name: 'Completion Date',
      type: 'date',
    },
    reward: {
      name: 'Reward',
      type: 'reward',
      default: {
        chain: {
          chainId: '137',
          name: 'polygon',
        },
        token: {
          address: '0x0',
          symbol: 'MATIC',
        },
        value: 0,
      },
    },
    grantStatus: {
      name: 'Status',
      type: 'singleSelect',
      default: {
        value: 0,
        label: 'Active',
      },
      options: [
        {
          value: 0,
          label: 'Active',
        },
        {
          value: 1,
          label: 'Completed',
        },
        {
          value: 2,
          label: 'Churned',
        },
      ],
    },
    'link-to-application': {
      name: 'Link to Application',
      type: 'shortText',
    },
  },
  propertyOrder: [
    'grantee',
    'programLiaison',
    'approvedOn',
    'completedOn',
    'reward',
    'grantStatus',
    'link-to-application',
  ],
} as CardTemplate;

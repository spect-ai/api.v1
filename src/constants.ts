import { CirclePermission, Roles } from './common/types/role.type';

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
      createNewForm: true,
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
      makePayment: false,
      inviteMembers: true,
      manageRoles: false,
      manageMembers: false,
      distributeCredentials: false,
      createNewForm: true,
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
      createNewForm: false,
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
  voter: {
    name: 'voter',
    description: 'Voter role',
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
      createNewForm: false,
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

export const permissionToPermissionNameMap = {
  createNewCircle: 'Create New Circle',
  manageCircleSettings: 'Manage Circle Settings',
  createNewProject: 'Create New Project',
  manageProjectSettings: 'Manage Project Settings',
  managePaymentOptions: 'Manage Payment Options',
  makePayment: 'Make Payment',
  inviteMembers: 'Invite Members',
  manageRoles: 'Manage Roles',
  manageMembers: 'Manage Members',
  createNewForm: 'Create New Form',
  manageFormSettings: 'Manage Form Settings',
  updateFormResponsesManually: 'Update Form Responses Manually',
  createNewCard: 'Create New Card',
} as const;

export const roleWithNoPermission = (roleName: string) => {
  return {
    name: roleName,
    description: `${roleName} role`,
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
      createNewForm: false,
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
  };
};

export const blockchainToChainIdMap = {
  bsc: 56,
  eth: 1,
  polygon: 137,
  avalanche: 43114,
  arbitrum: 42161,
  optimism: 10,
} as const;

export const chainIdToBlockchainMap = {
  56: 'bsc',
  1: 'eth',
  137: 'polygon',
  43114: 'avalanche',
  42161: 'arbitrum',
  10: 'optimism',
} as const;

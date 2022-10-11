import { CirclePermission, Roles } from './common/types/role.type';

export const defaultCircleCreatorRoles = ['steward'];

export const defaultCircleRoles = {
  steward: {
    name: 'steward',
    role: 'steward',
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
    role: 'member',
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
    role: 'applicant',
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

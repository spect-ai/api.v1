export type CardType = 'Task' | 'Bounty';

export type CardTypeToPermissionMap = {
  [key in CardType]: boolean;
};

export type CirclePermission = {
  createNewCircle: boolean;
  manageCircleSettings: boolean;
  createNewProject: boolean;
  manageProjectSettings: boolean;
  createNewRetro: boolean;
  endRetroManually: boolean;
  managePaymentOptions: boolean;
  makePayment: boolean;
  inviteMembers: boolean;
  manageRoles: boolean;
  manageMembers: boolean;
  manageRewards: CardTypeToPermissionMap;
  manageCardProperties: CardTypeToPermissionMap;
  createNewCard: CardTypeToPermissionMap;
  reviewWork: CardTypeToPermissionMap;
  canClaim: CardTypeToPermissionMap;
};

export type RoleProvider = {
  type: 'guild' | 'discord' | 'orca' | 'lit';
  data: object;
};

export type Role = {
  name?: string;

  description?: string;

  selfAssignable: string;

  permissions: CirclePermission;
};

export type Roles = {
  [key: number]: Role;
};

export type MemberRoles = {
  [key: string]: string[]; // MemberId -> role names
};

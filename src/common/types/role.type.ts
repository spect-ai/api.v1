export type CardType = 'Task' | 'Bounty';

export type CardTypeToPermissionMap = {
  [key in CardType]: boolean;
};

export type CirclePermission = {
  createNewCircle: boolean;
  manageCircleSettings: boolean;
  managePaymentOptions: boolean;
  makePayment: boolean;
  inviteMembers: boolean;
  manageRoles: boolean;
  manageMembers: boolean;
  distributeCredentials: boolean;
  createNewForm: boolean;
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

export type GuildRole = {
  name: string;
  id: number;
};

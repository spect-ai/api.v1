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
};

export type ProjectPermission = {
  manageProjectSettings: boolean;
  createNewCard: boolean;
  manageRewards: boolean;
  reviewWork: boolean;
};

export type RoleProvider = {
  type: 'guild' | 'discord' | 'orca' | 'lit';
  data: object;
};

export type Role = {
  id: number;
  name?: string;

  description?: string;

  selfAssignable: string;

  provider?: RoleProvider[];

  permissions: CirclePermission | ProjectPermission;
};

export type Roles = {
  [key: number]: Role;
};

export type MemberRoles = {
  [key: string]: number; // MemberId -> RoleId
};

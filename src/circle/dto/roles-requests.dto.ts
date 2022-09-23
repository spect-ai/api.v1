import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CardTypeBasedPermissions {
  @IsBoolean()
  Task: boolean;
  @IsBoolean()
  Bounty: boolean;
}

export class Permissions {
  @IsBoolean()
  createNewCircle: boolean;

  @IsBoolean()
  manageCircleSettings: boolean;

  @IsBoolean()
  createNewProject: boolean;

  @IsBoolean()
  manageProjectSettings: boolean;

  @IsBoolean()
  createNewRetro: boolean;

  @IsBoolean()
  endRetroManually: boolean;

  @IsBoolean()
  managePaymentOptions: boolean;

  @IsBoolean()
  makePayment: boolean;

  @IsBoolean()
  inviteMembers: boolean;

  @IsBoolean()
  manageRoles: boolean;

  @IsBoolean()
  manageMembers: boolean;

  @ValidateNested()
  @Type(() => CardTypeBasedPermissions)
  @IsNotEmpty()
  manageCardProperties: CardTypeBasedPermissions;

  @ValidateNested()
  @Type(() => CardTypeBasedPermissions)
  @IsNotEmpty()
  createNewCard: CardTypeBasedPermissions;

  @ValidateNested()
  @Type(() => CardTypeBasedPermissions)
  @IsNotEmpty()
  manageRewards: CardTypeBasedPermissions;

  @ValidateNested()
  @Type(() => CardTypeBasedPermissions)
  @IsNotEmpty()
  reviewWork: CardTypeBasedPermissions;

  @ValidateNested()
  @Type(() => CardTypeBasedPermissions)
  @IsNotEmpty()
  canClaim: CardTypeBasedPermissions;
}

export class AddRoleDto {
  /**
   * The role identifier
   */
  @IsString()
  @IsNotEmpty()
  role: string;

  /**
   * The alias for the role
   */
  @IsString()
  @IsOptional()
  name: string;

  /**
   * The description of the role
   */
  @IsString()
  @IsOptional()
  description: string;

  /**
   * Can the role be assigned to self?
   */
  @IsBoolean()
  @IsNotEmpty()
  selfAssignable: boolean;

  /**
   * Can the role be assigned to self?
   */
  @IsBoolean()
  @IsOptional()
  mutable?: boolean;

  /**
   * Can the role be assigned to self?
   */
  @ValidateNested()
  @Type(() => Permissions)
  @IsNotEmpty()
  permissions: Permissions;
}

export class UpdateRoleDto extends AddRoleDto {}

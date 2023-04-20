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
  managePaymentOptions: boolean;

  @IsBoolean()
  makePayment: boolean;

  @IsBoolean()
  inviteMembers: boolean;

  @IsBoolean()
  manageRoles: boolean;

  @IsBoolean()
  manageMembers: boolean;

  @IsBoolean()
  distributeCredentials: boolean;

  @IsBoolean()
  createNewForm: boolean;
}

export class AddRoleDto {
  /**
   * The alias for the role
   */
  @IsString()
  @IsNotEmpty()
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
   * Can the role be edited?
   */
  @IsBoolean()
  @IsOptional()
  mutable?: boolean;

  /**
   * Permissions of the role
   */
  @ValidateNested()
  @Type(() => Permissions)
  @IsNotEmpty()
  permissions: Permissions;
}

export class UpdateRoleDto extends AddRoleDto {}

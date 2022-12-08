import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  NetworkModel,
  PayWallOptions,
  PropertyType,
  UserType,
} from '../types/types';
import { IsValidPaywallOptions } from '../validations/paywall-validation.service';
import { IsValidRewardOptions } from '../validations/reward-validations.service';

export class OptionModel {
  @IsString()
  label: string;

  @IsString()
  value: string;
}

export class AddPropertyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum([
    'shortText',
    'email',
    'longText',
    'number',
    'user[]',
    'user',
    'reward',
    'date',
    'singleSelect',
    'multiSelect',
    'ethAddress',
    'milestone',
    'singleURL',
    'multiURL',
    'payWall',
  ])
  @IsNotEmpty()
  type: PropertyType;

  @IsString()
  @IsOptional()
  description: string;

  @IsOptional()
  default: any;

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => OptionModel)
  options: any;

  @IsOptional()
  @IsValidRewardOptions()
  rewardOptions: Map<string, NetworkModel>;

  @IsOptional()
  @IsValidPaywallOptions()
  payWallOptions: PayWallOptions;

  @IsBoolean()
  @IsOptional()
  isPartOfFormView: boolean;

  /**
   * User type of user fields
   */
  @IsString()
  @IsOptional()
  userType: UserType;

  /**
   * User types to notify upon update
   */
  @IsArray()
  @IsOptional()
  onUpdateNotifyUserTypes: UserType[];

  /**
   * Is this a required field
   */
  @IsBoolean()
  @IsOptional()
  required: boolean;

  /**
   * Fields in milestone
   */
  @IsArray()
  @IsOptional()
  milestoneFields: string[];
}

export class UpdatePropertyDto {
  /**
   * The name of the property
   */
  @IsString()
  @IsOptional()
  name: string;

  @IsEnum([
    'shortText',
    'longText',
    'number',
    'email',
    'user[]',
    'user',
    'reward',
    'date',
    'singleSelect',
    'multiSelect',
    'ethAddress',
    'milestone',
    'singleURL',
    'multiURL',
    'payWall',
  ])
  @IsOptional()
  type: PropertyType;

  @IsOptional()
  @IsValidPaywallOptions()
  payWallOptions: PayWallOptions;

  @IsString()
  @IsOptional()
  default: any;

  @IsString()
  @IsOptional()
  description: string;

  @IsOptional()
  @IsArray()
  @Type(() => OptionModel)
  options: any;

  @IsOptional()
  @IsValidRewardOptions()
  rewardOptions: Map<string, NetworkModel>;

  /**
   * Is the property visible in the forms?
   */
  @IsBoolean()
  @IsOptional()
  isPartOfFormView: boolean;

  /**
   * User type of user fields
   */
  @IsString()
  @IsOptional()
  userType: UserType;

  /**
   * User types to notify upon update
   */
  @IsArray()
  @IsOptional()
  onUpdateNotifyUserTypes: UserType[];

  /**
   * Is this a required field
   */
  @IsBoolean()
  @IsOptional()
  required: boolean;

  /**
   * Fields in milestone
   */
  @IsArray()
  @IsOptional()
  milestoneFields: string[];
}

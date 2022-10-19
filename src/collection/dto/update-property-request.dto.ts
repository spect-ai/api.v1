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
import { PropertyType, UserType } from '../types/types';
import { IsValidRewardOptions } from '../validations/reward-validations.service';

export class OptionModel {
  @IsString()
  label: string;

  @IsString()
  value: string;
}

export type TokenModel = {
  symbol: string;

  name: string;

  address: string;
};

export type NetworkModel = {
  name: string;

  chainId: string;

  tokens: TokenModel[];
};

export class AddPropertyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum([
    'shortText',
    'longText',
    'number',
    'user[]',
    'user',
    'reward',
    'date',
    'singleSelect',
    'multiSelect',
    'ethAddress',
  ])
  @IsNotEmpty()
  type: PropertyType;

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
    'user[]',
    'user',
    'reward',
    'date',
    'singleSelect',
    'multiSelect',
    'ethAddress',
  ])
  @IsOptional()
  type: PropertyType;

  @IsString()
  @IsOptional()
  default: any;

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
}

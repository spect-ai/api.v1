import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PropertyType, UserType } from '../types/types';

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
}

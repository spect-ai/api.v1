import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PropertyType } from '../types/types';

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
  options: any;

  @IsBoolean()
  @IsOptional()
  isPartOfFormView: boolean;
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
  options: any;

  /**
   * Is the property visible in the forms?
   */
  @IsBoolean()
  @IsOptional()
  isPartOfFormView: boolean;
}

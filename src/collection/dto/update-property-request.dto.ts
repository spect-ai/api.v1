import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PropertyType } from '../types/types';

export class AddPropertyDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  default: any;

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

  @IsString()
  @IsOptional()
  type: PropertyType;

  @IsString()
  @IsOptional()
  default: any;

  /**
   * Is the property visible in the forms?
   */
  @IsBoolean()
  @IsOptional()
  isPartOfFormView: boolean;
}

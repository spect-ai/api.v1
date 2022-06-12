import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { Project } from '../model/project.model';

export class UpdateProjectRequestDto {
  /**
   * The name of the project
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The name of the project
   */
  @IsString()
  @IsNotEmpty()
  slug: string;

  /**
   * Project is private or public
   */
  @IsBoolean()
  @IsOptional()
  private?: boolean;

  /**
   * Parents of the project
   */
  @IsBoolean()
  @IsOptional()
  parents?: boolean;

  /**
   * The order of the columns in the project
   */
  @IsArray()
  columnOrder?: string[];

  /**
   * The details of the columns in the project
   */
  @IsObject()
  columnDetails?: object;

  /**
   * Project is archived if true
   */
  @IsBoolean()
  @IsOptional()
  archived?: boolean;
}

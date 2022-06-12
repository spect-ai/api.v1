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

export class CreateProjectRequestDto {
  /**
   * The name of the project
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Project is private or public
   */
  @IsBoolean()
  @IsOptional()
  private?: boolean;

  /**
   * The parent circle of the project
   */
  @IsString()
  @IsNotEmpty()
  circleId?: string;

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
}

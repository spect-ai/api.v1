import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ObjectId } from 'mongoose';

export class AutomationDto {
  @IsString()
  @IsOptional()
  name: string;
}

export class CreateProjectDataDto {
  @IsArray()
  @IsNotEmpty()
  columns: string[];

  @IsArray()
  @IsNotEmpty()
  automations: string[];
}

export abstract class CreateTemplateDto {
  /**
   * The name of the template
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The type of the template
   */
  @IsString()
  @IsNotEmpty()
  type: 'project' | 'card';

  /**
   * The template data that will be populated when the template is used
   */
  @IsNotEmpty()
  @Type(() => CreateProjectDataDto)
  projectData: CreateProjectDataDto;

  /**
   * Circle id of the circle that the template will be created in
   */
  @IsString()
  @IsOptional()
  circle?: ObjectId;

  /**
   * The template is globally accessible. If set to false, template is only accessible within a circle
   */
  @IsBoolean()
  @IsOptional()
  global?: boolean;
}

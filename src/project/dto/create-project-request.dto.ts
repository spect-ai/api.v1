import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsString,
  IsObject,
} from 'class-validator';
import { MappedAutomation } from 'src/template/models/template.model';
import { ColumnDetailsDto } from './column-details.dto';

export class CreateProjectRequestDto {
  /**
   * The name of the project
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The description of the project
   */
  @IsString()
  @IsOptional()
  description?: string;

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
  circleId: string;

  /**
   * The order of the columns in the project
   */
  @IsArray()
  @IsOptional()
  columnOrder?: string[];

  /**
   * The details of the columns in the project
   */
  @ValidateNested()
  @IsOptional()
  columnDetails?: ColumnDetailsDto;

  /**
   * The priority of the automations in the project
   */
  @IsArray()
  @IsOptional()
  automationOrder?: string[];

  /**
   * The automations associated with the project, the trigger is the key and the value is the automation
   */
  @IsObject()
  @IsOptional()
  automations?: MappedAutomation;

  /**
   * The template of the project
   */
  @IsString()
  @IsOptional()
  fromTemplateId?: string;

  /**
   * The views of the project
   */
  @IsString()
  @IsOptional()
  trelloId?: string;
}

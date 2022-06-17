import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ColumnDetailsDto } from 'src/project/dto/column-details.dto';

export class ProjectTemplateData {
  @IsNotEmpty()
  columnOrder: string[];

  @IsNotEmpty()
  columnDetails: ColumnDetailsDto;
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
  @Type(() => ProjectTemplateData)
  projectData: ProjectTemplateData;

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

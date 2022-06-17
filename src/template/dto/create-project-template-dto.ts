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
   * The name of the temolate
   */
  @IsString()
  @IsNotEmpty()
  name?: string;

  /**
   * The type of the temolate
   */
  @IsString()
  @IsNotEmpty()
  type: 'project';

  /**
   * The template data that will be populated when the template is used
   */
  @IsNotEmpty()
  @Type(() => ProjectTemplateData)
  data: ProjectTemplateData;

  /**
   * The type of the temolate
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

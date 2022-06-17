import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';
import { Card } from 'src/card/model/card.model';
import { Project } from 'src/project/model/project.model';
import { Retro } from 'src/retro/models/retro.model';
import { ProjectTemplateData } from './create-project-template-dto';

export abstract class DetailedTemplateResponseDto {
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
  type: string;

  /**
   * The template data that will be populated when the template is used
   */
  @IsString()
  @IsNotEmpty()
  data: ProjectTemplateData;

  /**
   * The creator of the temolate
   */
  @IsString()
  @IsOptional()
  creator?: ObjectId;
}

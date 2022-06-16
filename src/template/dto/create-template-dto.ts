import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ObjectId } from 'mongoose';
import { Card } from 'src/card/model/card.model';
import { Project } from 'src/project/model/project.model';
import { Retro } from 'src/retro/models/retro.model';

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
  type: 'project' | 'card' | 'retro';

  /**
   * The template data that will be populated when the template is used
   */
  @IsObject()
  @IsNotEmpty()
  data: Project | Card | Retro;

  /**
   * The type of the temolate
   */
  @IsString()
  @IsOptional()
  circle?: ObjectId;

  /**
   * The type of the temolate
   */
  @IsString()
  @IsOptional()
  project?: ObjectId;

  /**
   * The template is globally accessible
   */
  @IsBoolean()
  @IsOptional()
  global?: boolean;
}

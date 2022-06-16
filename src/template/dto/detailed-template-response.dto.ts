import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';
import { Card } from 'src/card/model/card.model';
import { Project } from 'src/project/model/project.model';
import { Retro } from 'src/retro/models/retro.model';

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
  type: 'project' | 'card' | 'retro';

  /**
   * The template data that will be populated when the template is used
   */
  @IsString()
  @IsNotEmpty()
  data: Project | Card | Retro;

  /**
   * The creator of the temolate
   */
  @IsString()
  @IsOptional()
  creator?: ObjectId;
}

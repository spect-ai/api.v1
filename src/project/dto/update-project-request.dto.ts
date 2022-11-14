import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Filter, View } from '../types/types';

export class UpdateProjectRequestDto {
  /**
   * The name of the project
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  /**
   * The description of the project
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * The default view of the project
   */
  @IsString()
  @IsOptional()
  defaultView?: string;

  /**
   * Project is private or public
   */
  @IsBoolean()
  @IsOptional()
  private?: boolean;

  /**
   * Array containing column order
   */
  @IsArray()
  @IsOptional()
  columnOrder?: string[];

  /**
   * Project is archived if true
   */
  @IsBoolean()
  @IsOptional()
  archived?: boolean;

  /**
   * Channel in which discussion threads about cards in the circle will be posted
   */
  @IsOptional()
  discordDiscussionChannel: {
    id: string;
    name: string;
  };
}

export class AddViewDto {
  /**
   * The type of the view
   */
  @IsObject()
  @IsNotEmpty()
  filters: Filter;

  /**
   * The type of the view
   */
  @IsString()
  @IsNotEmpty()
  type: View['type'];

  /**
   * Is the view hidden?
   */
  @IsBoolean()
  hidden: boolean;

  /**
   * Name of the view
   */
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateViewDto {
  /**
   * The type of the view
   */
  @IsObject()
  @IsOptional()
  filters?: Filter;

  /**
   * The type of the view
   */
  @IsString()
  @IsOptional()
  type?: View['type'];

  /**
   * Is the view hidden?
   */
  @IsBoolean()
  @IsOptional()
  hidden?: boolean;

  /**
   * Name of the view
   */
  @IsString()
  @IsOptional()
  name?: string;
}

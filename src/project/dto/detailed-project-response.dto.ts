import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  ValidateNested,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Project } from '../model/project.model';
import { ObjectId } from 'mongoose';
import { prop, Ref } from '@typegoose/typegoose';
import { Circle } from 'src/circles/model/circle.model';

export class DetailedProjectResponseDto {
  /**
   * The name of the circle
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The parents of the circle, aka, the circles that contain this project
   */
  @IsOptional()
  @ValidateNested()
  parents?: ObjectId[];

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

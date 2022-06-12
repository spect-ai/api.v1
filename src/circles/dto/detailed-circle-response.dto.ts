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
import { Circle } from '../model/circle.model';
import { ObjectId } from 'mongoose';
import { prop, Ref } from '@typegoose/typegoose';

export class DetailedCircleResponseDto {
  /**
   * The name of the circle
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The description of the circle
   */
  @IsString()
  description?: string;

  /**
   * The avatar of the circle
   */
  @IsString()
  avatar?: string;

  /**
   * The children of the circle, aka, the circles that this circle contains
   */
  @IsOptional()
  @ValidateNested()
  parents?: Ref<Circle>[];

  /**
   * The children of the circle, aka, the circles that this circle contains
   */
  @IsOptional()
  @ValidateNested()
  children?: Ref<Circle>[];

  /**
   * The projects in the circle
   */
  @IsArray()
  projects?: string[];
}

import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { Circle } from '../model/circle.model';

export class CreateCircleRequestDto {
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
  @IsOptional()
  description?: string;

  /**
   * The avatar of the circle
   */
  @IsString()
  @IsOptional()
  avatar?: string;

  /**
   * Circle is private or public
   */
  @IsBoolean()
  @IsOptional()
  private?: boolean;

  /**
   * The website associated with the circle
   */
  @IsString()
  @IsOptional()
  @IsUrl()
  website?: string;

  /**
   * The twitter account associated with the circle
   */
  @IsString()
  @IsOptional()
  @IsUrl()
  twitter?: string;

  /**
   * The github account associated with the circle
   */
  @IsString()
  @IsOptional()
  @IsUrl()
  github?: string;

  /**
   * The email associated with the circle
   */
  @IsString()
  @IsOptional()
  email?: string;

  /**
   * The email associated with the circle
   */
  @IsString()
  @IsOptional()
  parent?: string;
}

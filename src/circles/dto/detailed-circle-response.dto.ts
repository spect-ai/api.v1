import { IsArray, IsNotEmpty, IsObject, IsString } from 'class-validator';

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
   * The parents of the circle, aka, the circles that this circle is a part of
   */
  @IsArray()
  parents?: string[];

  /**
   * The children of the circle, aka, the circles that this circle contains
   */
  @IsArray()
  children?: string[];

  /**
   * The projects in the circle
   */
  @IsArray()
  projects?: string[];

  /**
   * The details of the circle
   */
  @IsObject()
  circleDetails?: any;
}

import {
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';

type MinimalDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

type MinimalDetails = {
  [key: string]: MinimalDetail;
};

export class EntitiesInCircleResponseDto {
  /**
   * The id of the circle
   */
  @IsString()
  @IsNotEmpty()
  id: string;

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
   * The parents of the circle, aka, the circle that this circle belongs to
   */
  @ValidateNested()
  parents?: MinimalDetails;

  /**
   * The children of the circle, aka, the circles that this circle contains
   */
  @IsObject()
  children?: MinimalDetails;

  /**
   * The projects in the circle
   */
  @ValidateNested()
  collections?: MinimalDetails;
}

import { Ref } from '@typegoose/typegoose';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ObjectId } from 'mongoose';

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
  @ValidateNested()
  parents?: ObjectId[];

  /**
   * The children of the circle, aka, the circles that this circle contains
   */
  @ValidateNested()
  children?: ObjectId[];

  /**
   * The projects in the circle
   */
  @ValidateNested()
  projects?: ObjectId[];

  /**
   * The members in the circle
   */
  @ValidateNested()
  members?: ObjectId[];

  /**
   * The members in the circle
   */
  @IsObject()
  roles?: object;

  /**
   * The members in the circle
   */
  @IsObject()
  memberRoles?: object;

  /**
   * The default payment used in the circle
   */
  @IsObject()
  defaultPayment?: object;

  /**
   * The circle is archived or not
   */
  @IsBoolean()
  archived?: boolean;

  /**
   * The activity history in the circle
   */
  @IsObject()
  activity?: object;

  /**
   * The members mapped to their respective info
   */
  @IsObject()
  memberDetails?: object;
}

import { Ref } from '@typegoose/typegoose';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Project } from 'src/project/model/project.model';
import { User } from 'src/users/model/users.model';
import { Circle } from '../model/circle.model';

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
  parents?: Ref<Circle>[];

  /**
   * The children of the circle, aka, the circles that this circle contains
   */
  @ValidateNested()
  children?: Ref<Circle>[];

  /**
   * The projects in the circle
   */
  @ValidateNested()
  projects?: Ref<Project>[];

  /**
   * The members in the circle
   */
  @ValidateNested()
  members?: Ref<User>[];

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
}

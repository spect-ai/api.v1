import { Ref } from '@typegoose/typegoose';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ObjectId } from 'mongoose';
import { Circle } from '../model/circle.model';
import { Payment } from 'src/common/models/payment.model';
import { Status } from 'src/common/types/status.type';

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
   * The retros in the circle
   */
  @ValidateNested()
  retro?: ObjectId[];

  /**
   * The projects in the circle
   */
  @ValidateNested()
  collections?: string[];

  /**
   * The members in the circle
   */
  @ValidateNested()
  members?: string[];

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

  /**
   * Safe addresses of the circle
   */
  @IsObject()
  safeAddress?: object;

  /**
   * Is circle private?
   */
  @IsBoolean()
  private?: boolean;

  /**
   * Is circle to be claimed?
   */
  @IsBoolean()
  toBeClaimed?: boolean;

  /**
   * Is caller unauthorized to view private properties of circle?
   */
  @IsBoolean()
  unauthorized?: boolean;
}

export class BucketizedCircleResponseDto {
  memberOf?: Partial<Circle>[];
  claimable?: Partial<Circle>[];
  joinable?: Partial<Circle>[];
}

type MinimalDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

type MinimalDetails = {
  [key: string]: MinimalDetail;
};

type MinimalRetro = {
  [key: string]: {
    title: string;
    slug: string;
    id: string;
    status: Status;
    reward: Payment;
    members: string[];
  };
};

export class CircleResponseDto {
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
  @IsObject()
  children?: MinimalDetails;

  /**
   * The projects in the circle
   */
  @IsObject()
  projects?: MinimalDetails;
  /**
   * The retros in the circle
   */
  @IsObject()
  retro?: MinimalRetro;

  /**
   * The projects in the circle
   */
  @ValidateNested()
  collections?: string[];

  /**
   * The members in the circle
   */
  @ValidateNested()
  members?: string[];

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

  /**
   * Safe addresses of the circle
   */
  @IsObject()
  safeAddress?: object;

  /**
   * Is circle private?
   */
  @IsBoolean()
  private?: boolean;

  /**
   * Is circle to be claimed?
   */
  @IsBoolean()
  toBeClaimed?: boolean;

  /**
   * Is caller unauthorized to view private properties of circle?
   */
  @IsBoolean()
  unauthorized?: boolean;
}

import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ObjectId } from 'mongoose';
import { Circle } from '../model/circle.model';
import { Folder } from '../types';
import { MappedItem } from 'src/common/interfaces';

export class CreateFolderDto {
  /**
   * Name of the folder
   **/
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Description of the folder
   **/
  @IsString()
  @IsNotEmpty()
  avatar: string;

  /**
   * Contents of the folder
   **/
  @IsArray()
  @IsOptional()
  contentIds?: string[];
}

export class UpdateFolderDto {
  /**
   * Name of the folder
   **/
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * Description of the folder
   **/
  @IsString()
  @IsOptional()
  avatar?: string;

  /**
   * Contents of the folder
   **/
  @IsArray()
  @IsOptional()
  contentIds?: string[];
}

type MinimalFolder = {
  id: string;
  contentIds: string[];
};

export class UpdateFolderDetailsDto {
  /**
   * FolderDetails to be updated
   */
  @IsArray()
  folderDetails: MinimalFolder[];
}

export class FolderParamDto {
  /**
   * ID of the folder
   **/
  @IsString()
  @IsNotEmpty()
  folderId: string;
}

export class UpdateFolderOrderDto {
  /**
   * Order of the folder
   * */
  @IsArray()
  @IsNotEmpty()
  folderOrder: string[];
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

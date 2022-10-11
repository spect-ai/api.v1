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
import { Payment } from 'src/common/models/payment.model';
import { Status } from 'src/common/types/status.type';

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

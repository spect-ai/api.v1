import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

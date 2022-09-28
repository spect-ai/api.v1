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
   * Projects in the folder
   **/
  @IsArray()
  @IsOptional()
  projectIds?: string[];

  /**
   * Workstreams in the folder
   **/
  @IsArray()
  @IsOptional()
  workstreamIds?: string[];

  /**
   * Retros in the folder
   **/
  @IsArray()
  @IsOptional()
  retroIds?: string[];
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
   * Projects in the folder
   **/
  @IsArray()
  @IsOptional()
  projectIds?: string[];

  /**
   * Workstreams in the folder
   **/
  @IsArray()
  @IsOptional()
  workstreamIds?: string[];

  /**
   * Retros in the folder
   **/
  @IsArray()
  @IsOptional()
  retroIds?: string[];
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

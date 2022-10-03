import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class AddDataDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  readonly collectionId: string;

  @IsString()
  @IsNotEmpty()
  readonly data: any;
}

export class UpdateDataDto {}

export class RemoveDataDto {}

export class ArchiveDataDto {}

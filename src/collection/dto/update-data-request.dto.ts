import { IsMongoId, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class AddDataDto {
  @IsObject()
  @IsNotEmpty()
  readonly data: any;
}

export class UpdateDataDto {
  @IsObject()
  @IsNotEmpty()
  readonly data: any;
}

export class ArchiveDataDto {}

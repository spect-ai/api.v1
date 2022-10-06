import { IsMongoId, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class AddDataDto {
  @IsObject()
  @IsNotEmpty()
  readonly data: object;
}

export class UpdateDataDto {
  @IsObject()
  @IsNotEmpty()
  readonly data: object;
}

export class ArchiveDataDto {}

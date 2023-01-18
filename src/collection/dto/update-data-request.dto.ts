import { IsBoolean, IsNotEmpty, IsObject } from 'class-validator';

export class AddDataDto {
  @IsObject()
  @IsNotEmpty()
  readonly data: object;

  @IsBoolean()
  @IsNotEmpty()
  readonly anon: boolean;
}

export class UpdateDataDto {
  @IsObject()
  @IsNotEmpty()
  readonly data: object;
}

export class VoteDataDto {
  @IsNotEmpty()
  readonly vote: number;
}

export class ArchiveDataDto {}

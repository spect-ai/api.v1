import { IsNotEmpty, IsObject } from 'class-validator';

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

export class VoteDataDto {
  @IsNotEmpty()
  readonly vote: number;
}

export class ArchiveDataDto {}

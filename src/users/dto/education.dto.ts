import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class AddEducationDto {
  @IsString()
  @IsOptional()
  courseDegree: string;

  @IsString()
  @IsOptional()
  school: string;

  @IsString()
  @IsOptional()
  schoolLogo: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  start_date: string;

  @IsString()
  @IsOptional()
  end_date: string;

  @IsString()
  @IsOptional()
  currentlyStudying: string;

  @IsString()
  @IsOptional()
  nfts: string[];

  @IsString()
  @IsOptional()
  poaps: string[];

  @IsArray()
  @IsOptional()
  verifiableCredentials: Credential[];
}

export class UpdateEducationDto extends AddEducationDto {}

export class AddMultipleEducationDto {
  @IsArray()
  experiences: AddEducationDto[];
}

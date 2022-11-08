import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class AddExperienceDto {
  @IsString()
  @IsOptional()
  role: string;

  @IsString()
  @IsOptional()
  organization: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  startDate: string;

  @IsString()
  @IsOptional()
  endDate: string;

  @IsArray()
  @IsOptional()
  credentials: Credential[];

  @IsString()
  @IsOptional()
  lensHandle: string;

  @IsString()
  @IsOptional()
  idOnLens: string;
}

export class UpdateExperienceDto extends AddExperienceDto {}

export class AddMultipleExperiencesDto {
  @IsArray()
  experiences: AddExperienceDto[];
}

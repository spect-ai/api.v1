import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class AddExperienceDto {
  @IsString()
  @IsOptional()
  jobTitle: string;

  @IsString()
  @IsOptional()
  company: string;

  @IsString()
  @IsOptional()
  companyLogo: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  start_date: string;

  @IsString()
  @IsOptional()
  end_date: string;

  @IsArray()
  @IsOptional()
  verifiableCredentials: Credential[];

  @IsString()
  @IsOptional()
  currentlyWorking: string;

  @IsString()
  @IsOptional()
  nfts: string;
}

export class UpdateExperienceDto extends AddExperienceDto {}

export class AddMultipleExperiencesDto {
  @IsArray()
  experiences: AddExperienceDto[];
}

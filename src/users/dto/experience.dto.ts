import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { LensDate, LensEducation, VerifiableCredential } from '../types/types';

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

  @IsObject()
  @IsOptional()
  start_date: LensDate | null;

  @IsObject()
  @IsOptional()
  end_date: LensDate | null;

  @IsArray()
  @IsOptional()
  verifiableCredentials: VerifiableCredential[];

  @IsBoolean()
  @IsOptional()
  currentlyWorking: string;

  @IsArray()
  @IsOptional()
  nfts: string;
}

export class UpdateExperienceDto extends AddExperienceDto {}

export class AddMultipleExperiencesDto {
  @IsArray()
  experiences: AddExperienceDto[];
}

import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { VerifiableCredential } from '../types/types';

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

  @IsObject()
  @IsOptional()
  start_date: string;

  @IsObject()
  @IsOptional()
  end_date: string;

  @IsBoolean()
  @IsOptional()
  currentlyStudying: boolean;

  @IsArray()
  @IsOptional()
  nfts: string[];

  @IsArray()
  @IsOptional()
  poaps: string[];

  @IsArray()
  @IsOptional()
  verifiableCredentials: VerifiableCredential[];
}

export class UpdateEducationDto extends AddEducationDto {}

export class AddMultipleEducationDto {
  @IsArray()
  experiences: AddEducationDto[];
}

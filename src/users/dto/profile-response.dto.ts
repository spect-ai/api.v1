import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { LensEducation, LensExperience, LensSkills } from '../types/types';

export class PublicProfileResponseDto {
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  username: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsArray()
  @IsOptional()
  skillsV2?: LensSkills[];

  @IsObject()
  @IsOptional()
  experiences?: LensExperience[];

  //   @IsArray()
  //   @IsOptional()
  //   experienceOrder?: string[];

  @IsObject()
  @IsOptional()
  education?: LensEducation[];

  //   @IsArray()
  //   @IsOptional()
  //   educationOrder?: string[];

  @IsString()
  @IsNotEmpty()
  ethAddress: string;

  @IsString()
  @IsNotEmpty()
  lensHandle?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}

export class PrivateProfileResponseDto {
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  username: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsArray()
  @IsOptional()
  skillsV2?: LensSkills[];

  @IsObject()
  @IsOptional()
  experiences?: LensExperience[];

  @IsObject()
  @IsOptional()
  education?: LensEducation[];

  @IsString()
  @IsNotEmpty()
  ethAddress: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsNotEmpty()
  email?: string;

  @IsString()
  @IsNotEmpty()
  lensHandle?: string;

  @IsString()
  @IsNotEmpty()
  discordId?: string;

  apiKeys?: any;
}

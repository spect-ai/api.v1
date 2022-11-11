import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  Education,
  Experience,
  LensEducation,
  LensExperience,
  LensSkills,
  Skill,
} from '../types/types';

export class PublicProfileResponseDto {
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
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  username: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsArray()
  @IsOptional()
  skillsV2?: Skill[];

  @IsObject()
  @IsOptional()
  experiences?: { [key: string]: Experience };

  @IsArray()
  @IsOptional()
  experienceOrder?: string[];

  @IsObject()
  @IsOptional()
  education?: { [key: string]: Education };

  @IsArray()
  @IsOptional()
  educationOrder?: string[];

  @IsString()
  @IsNotEmpty()
  ethAddress: string;

  @IsString()
  @IsOptional()
  avatar: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  lensHandle: string;
}

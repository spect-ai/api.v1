import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class AddEducationDto {
  @IsString()
  @IsOptional()
  title: string;

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
  lensEducationId: string;
}

export class UpdateEducationDto extends AddEducationDto {}

export class AddMultipleEducationDto {
  @IsArray()
  experiences: AddEducationDto[];
}

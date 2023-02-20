import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { HasMimeType, IsFile } from 'nestjs-form-data';

export class CreateCredentialRequestDto {
  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsNotEmpty()
  providerName: string;

  @IsString()
  @IsNotEmpty()
  providerUrl: string;

  @IsString()
  @IsNotEmpty()
  providerImage: string;

  @IsString()
  @IsNotEmpty()
  issuer: string;

  @IsString()
  @IsOptional()
  issuerName: string;

  @IsNumber()
  @IsNotEmpty()
  defaultScore: number;

  @IsString()
  @IsOptional()
  stampName: string;

  @IsString()
  @IsNotEmpty()
  stampDescription: string;
}

export class CreatePOAPDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  eventUrl: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsOptional()
  country: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  virtual: boolean;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  requestedCodes: number;
}

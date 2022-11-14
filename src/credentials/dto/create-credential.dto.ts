import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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

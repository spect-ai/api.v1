import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PublicProfileResponseDto {
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  username: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsNotEmpty()
  ethAddress: string;

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
  discordId?: string;

  apiKeys?: any;
}

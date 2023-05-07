import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePrivateCircleRequestDto {
  @IsString()
  @IsNotEmpty()
  circleId: string;

  @IsString()
  @IsNotEmpty()
  mintkudosApiKey: string;

  @IsString()
  @IsNotEmpty()
  mintkudosCommunityId: string;
}

export class UpdatePrivateCircleRequestDto {
  @IsString()
  @IsOptional()
  mintkudosApiKey?: string;

  @IsString()
  @IsOptional()
  mintkudosCommunityId?: string;

  @IsString()
  @IsOptional()
  zealyApiKey?: string;

  @IsString()
  @IsOptional()
  zealySubdomain?: string;
}

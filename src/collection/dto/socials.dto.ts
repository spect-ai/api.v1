import { IsOptional, IsString } from 'class-validator';

export class SocialsDto {
  @IsOptional()
  @IsString()
  readonly telegramId: string;

  @IsOptional()
  @IsString()
  readonly telegramUsername: string;

  @IsOptional()
  @IsString()
  readonly githubId: string;

  @IsOptional()
  @IsString()
  readonly githubUsername: string;

  @IsOptional()
  @IsString()
  readonly githubAvatar: string;

  @IsOptional()
  @IsString()
  readonly discordId: string;

  @IsOptional()
  @IsString()
  readonly discordUsername: string;

  @IsOptional()
  @IsString()
  readonly discordAvatar: string;
}

import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StartVotingPeriodRequestDto {
  @IsString()
  @IsOptional()
  readonly endsOn?: string;

  @IsBoolean()
  @IsOptional()
  readonly postOnSnapshot?: boolean;
}

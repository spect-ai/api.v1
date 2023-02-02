import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StartVotingPeriodRequestDto {
  @IsString()
  @IsOptional()
  readonly endsOn?: string;

  @IsBoolean()
  @IsOptional()
  readonly postOnSnapshot?: boolean;

  @IsString()
  @IsOptional()
  readonly space?: string;

  @IsString()
  @IsOptional()
  readonly proposalId?: string;
}

export class SnapshotProposalDto {
  @IsString()
  readonly proposalId: string;

  @IsString()
  readonly snapshotSpace: string;
}

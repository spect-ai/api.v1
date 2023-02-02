import {
  SnapshotProposalDto,
  StartVotingPeriodRequestDto,
} from 'src/collection/dto/voting.dto';
import { User } from 'src/users/model/users.model';

export class VoteDataCommand {
  constructor(
    public readonly dataSlug: string,
    public readonly caller: User,
    public readonly collectionId: string,
    public readonly vote: number,
  ) {}
}

export class StartVotingPeriodCommand {
  constructor(
    public readonly dataSlug: string,
    public readonly collectionId: string,
    public readonly caller?: User,
    public readonly startVotingPeriodRequestDto?: StartVotingPeriodRequestDto,
  ) {}
}

export class EndVotingPeriodCommand {
  constructor(
    public readonly dataSlug: string,
    public readonly caller: User,
    public readonly collectionId: string,
  ) {}
}

export class RecordSnapshotProposalCommand {
  constructor(
    public readonly collectionId: string,
    public readonly dataSlug: string,
    public readonly snapshotProposalDto: SnapshotProposalDto,
    public readonly caller: User,
  ) {}
}

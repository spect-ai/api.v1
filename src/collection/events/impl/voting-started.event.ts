import { Collection } from 'src/collection/model/collection.model';
import { User } from 'src/users/model/users.model';
import { StartVotingPeriodRequestDto } from 'src/collection/dto/voting.dto';

export class VotingStartedEvent {
  constructor(
    public readonly collection: Collection,
    public readonly snapshot: StartVotingPeriodRequestDto,
    public readonly dataSlug: string,
    public readonly caller?: User,
  ) {}
}

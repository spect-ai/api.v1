import { User } from 'src/users/model/users.model';

export class VoteDataCommand {
  constructor(
    public readonly dataSlug: string,
    public readonly caller: User,
    public readonly collectionId: string,
    public readonly vote: number,
  ) {}
}

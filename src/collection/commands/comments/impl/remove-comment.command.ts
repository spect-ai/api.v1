import { User } from 'src/users/model/users.model';

export class RemoveCommentCommand {
  constructor(
    public readonly collectionId: string,
    public readonly dataSlug: string,
    public readonly activityId: string,
    public readonly caller: User,
  ) {}
}

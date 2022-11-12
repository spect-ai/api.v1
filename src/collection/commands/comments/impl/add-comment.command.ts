import { Ref } from 'src/collection/types/types';
import { MappedItem } from 'src/common/interfaces';
import { User } from 'src/users/model/users.model';

export class AddCommentCommand {
  constructor(
    public readonly collectionId: string,
    public readonly dataSlug: string,
    public readonly content: string,
    public readonly ref: MappedItem<Ref>,
    public readonly caller: User,
    public readonly isPublic?: boolean,
  ) {}
}

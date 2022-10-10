import { AddDataDto } from 'src/collection/dto/update-data-request.dto';
import { Ref } from 'src/collection/types/types';
import { MappedItem } from 'src/common/interfaces';
import { User } from 'src/users/model/users.model';

export class UpdateCommentCommand {
  constructor(
    public readonly collectionId: string,
    public readonly dataSlug: string,
    public readonly activityId: string,
    public readonly content: string,
    public readonly ref: MappedItem<Ref>,
    public readonly caller: User,
  ) {}
}

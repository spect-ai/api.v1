import { UpdateCollectionDto } from 'src/collection/dto/update-collection-request.dto';
import { User } from 'src/users/model/users.model';

export class UpdateCollectionCommand {
  constructor(
    public readonly updateCollectionDto: UpdateCollectionDto,
    public readonly caller: User,
    public readonly collectionId: string,
  ) {}
}

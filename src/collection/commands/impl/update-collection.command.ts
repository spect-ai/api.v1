import { UpdateCollectionDto } from 'src/collection/dto/update-collection-request.dto';
import { User } from 'src/users/model/users.model';

export class UpdateCollectionCommand {
  constructor(
    public readonly updateCollectionDto: Partial<UpdateCollectionDto>,
    public readonly caller: string,
    public readonly collectionId: string,
  ) {}
}

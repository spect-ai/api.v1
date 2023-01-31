import { FilterQuery } from 'mongoose';
import { UpdateCollectionDto } from 'src/collection/dto/update-collection-request.dto';
import { Collection } from 'src/collection/model/collection.model';
import { User } from 'src/users/model/users.model';

export class UpdateCollectionCommand {
  constructor(
    public readonly updateCollectionDto: Partial<UpdateCollectionDto>,
    public readonly caller: string,
    public readonly collectionId: string,
  ) {}
}

export class UpdateCollectionByFilterCommand {
  constructor(
    public readonly updateCollectionDto: Partial<UpdateCollectionDto>,
    public readonly caller: User,
    public readonly filter: FilterQuery<Collection>,
  ) {}
}

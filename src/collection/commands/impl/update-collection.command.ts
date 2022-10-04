import { Circle } from 'src/circle/model/circle.model';
import { UpdateCollectionDto } from 'src/collection/dto/update-collection-request.dto';

export class UpdateCollectionCommand {
  constructor(
    public readonly updateCollectionDto: UpdateCollectionDto,
    public readonly caller: string,
    public readonly collectionId: string,
  ) {}
}

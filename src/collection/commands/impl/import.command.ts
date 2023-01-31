import { CreateCollectionDto } from 'src/collection/dto/create-collection-request.dto';
import { Property } from 'src/collection/types/types';
import { MappedItem } from 'src/common/interfaces';

export class ImportCommand {
  constructor(
    public readonly data: object[],
    public readonly collectionName: string,
    public readonly collectionProperties: MappedItem<Property>,
    public readonly groupByColumn: string,
    public readonly circleId: string,
    public readonly caller: string,
  ) {}
}

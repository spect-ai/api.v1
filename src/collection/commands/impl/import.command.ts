import { Property } from 'src/collection/types/types';
import { MappedItem } from 'src/common/interfaces';

export class ImportCommand {
  constructor(
    public readonly data: object[],
    public readonly collectionId: string,
    public readonly collectionProperties: MappedItem<Property>,
    public readonly groupByColumn: string,
    public readonly circleId: string,
    public readonly caller: string,
  ) {}
}

import { Circle } from 'src/circle/model/circle.model';
import { Collection } from 'src/collection/model/collection.model';

export class GetTriggeredCollectionAutomationsQuery {
  constructor(
    public readonly collection: Collection,
    public readonly dataUpdate: object,
    public readonly caller: string,
    public readonly circle: Circle,
    public readonly dataSlug: string,
  ) {}
}

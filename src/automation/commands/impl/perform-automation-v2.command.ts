import { Circle } from 'src/circle/model/circle.model';
import { UpdateDataDto } from 'src/collection/dto/update-data-request.dto';
import { Collection } from 'src/collection/model/collection.model';

export class PerformAutomationOnCollectionDataUpdateCommand {
  constructor(
    public readonly collection: Collection,
    public readonly dataUpdate: object,
    public readonly dataSlug: string,
    public readonly caller: string,
    public readonly circle: Circle,
  ) {}
}

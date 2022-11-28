import { PerformAutomationCommandContainer } from 'src/automation/types/types';
import { Circle } from 'src/circle/model/circle.model';
import { UpdateDataDto } from 'src/collection/dto/update-data-request.dto';
import { Collection } from 'src/collection/model/collection.model';
import { MappedItem } from 'src/common/interfaces';

export class GetTriggeredAutomationsQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly caller: string,
  ) {}
}

export class GetTriggeredRootAutomationsQuery {
  constructor(
    public readonly performAutomationCommandContainer: PerformAutomationCommandContainer,
    public readonly caller: string,
  ) {}
}

export class GetTriggeredCollectionAutomationsQuery {
  constructor(
    public readonly collection: Collection,
    public readonly dataUpdate: object,
    public readonly caller: string,
    public readonly circle: Circle,
    public readonly dataSlug: string,
  ) {}
}

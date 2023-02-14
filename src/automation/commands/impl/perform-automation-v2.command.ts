import { Circle } from 'src/circle/model/circle.model';
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

export class PerformAutomationOnCollectionDataAddCommand {
  constructor(
    public readonly collection: Collection,
    public readonly data: any,
    public readonly dataSlug: string,
    public readonly caller: string,
    public readonly circle: Circle,
  ) {}
}

export class PerformAutomationOnPaymentCompleteCommand {
  constructor(
    public readonly collection: Collection,
    public readonly data: any,
    public readonly dataSlug: string,
    public readonly caller: string,
    public readonly circle: Circle,
  ) {}
}
export class PerformAutomationOnPaymentCancelledCommand {
  constructor(
    public readonly collection: Collection,
    public readonly data: any,
    public readonly dataSlug: string,
    public readonly caller: string,
    public readonly circle: Circle,
  ) {}
}

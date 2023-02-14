import { Circle } from 'src/circle/model/circle.model';
import { Collection } from 'src/collection/model/collection.model';

export class PaymentUpdateEvent {
  constructor(
    public readonly collection: Collection,
    public readonly circle: Circle,
    public readonly caller: string,
    public readonly paymentStatus: {
      [dataSlug: string]: string | null;
    },
  ) {}
}

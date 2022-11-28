import { Trigger } from 'src/circle/types';
import { UpdateCollectionDto } from 'src/collection/dto/update-collection-request.dto';
import { Collection } from 'src/collection/model/collection.model';

export class IsTriggeredSelectFieldQuery {
  constructor(
    public readonly prevCollection: Collection,
    public readonly update: object,
    public readonly trigger: Trigger,
    public readonly dataSlug: string,
  ) {}
}

export const triggerIdToQueryHandlerMapNew = {
  dataChange: {
    singleSelect: IsTriggeredSelectFieldQuery,
  },
};

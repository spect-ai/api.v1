import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { IsTriggeredSelectFieldQuery } from '../impl/is-triggered-v2.query';

@QueryHandler(IsTriggeredSelectFieldQuery)
export class IsTriggeredSelectFieldQueryHandler
  implements IQueryHandler<IsTriggeredSelectFieldQuery>
{
  async execute(query: IsTriggeredSelectFieldQuery): Promise<boolean> {
    console.log('IsTriggeredSelectFieldQueryHandler');

    const { trigger, prevCollection, update, dataSlug } = query;
    const from = trigger.data.from;
    const to = trigger.data.to;
    if (!from && !to) return false;

    if (from.length > 0) {
      const fromValues = from.map((val) => val.value);
      if (
        !fromValues.includes(
          prevCollection.data[dataSlug][trigger.data.fieldName]?.['value'],
        )
      )
        return false;
    }

    if (to.length) {
      const toValues = to.map((val) => val.value);

      if (!toValues.includes(update[trigger.data.fieldName]?.['value']))
        return false;
    }

    return true;
  }
}

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

    console.log({ from, to });
    console.log({ fieldname: trigger.data.fieldName });
    console.log({ update });
    console.log({ prev: prevCollection.data[trigger.data.fieldName] });

    if (
      from &&
      !from.includes(
        prevCollection.data[dataSlug][trigger.data.fieldName]?.['value'],
      )
    ) {
      return false;
    }

    if (to && !to.includes(update[trigger.data.fieldName]?.value)) {
      return false;
    }

    return true;
  }
}

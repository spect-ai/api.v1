import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import {
  GetTriggeredAutomationForMultipleCardsQuery,
  GetTriggeredAutomationsQuery,
} from '../impl';
import { triggerIdToQueryHandlerMap } from '../impl/is-triggered.query';

@QueryHandler(GetTriggeredAutomationForMultipleCardsQuery)
export class GetTriggeredAutomationForMultipleCardsQueryHandler
  implements IQueryHandler<GetTriggeredAutomationForMultipleCardsQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(
    query: GetTriggeredAutomationForMultipleCardsQuery,
  ): Promise<{ [id: string]: string[] }> {
    console.log('GetTriggeredAutomationForMultipleCardsHandler');
    const { cards, updates, projects } = query;

    const cardIdToTriggeredAutomation = {};
    for (const card of cards) {
      cardIdToTriggeredAutomation[card.id] = this.queryBus.execute(
        new GetTriggeredAutomationsQuery(
          card,
          updates[card.id],
          Object.values(projects[card.project].automations),
        ),
      );
    }

    return cardIdToTriggeredAutomation;
  }
}

@QueryHandler(GetTriggeredAutomationsQuery)
export class GetTriggeredAutomationsQueryHandler
  implements IQueryHandler<GetTriggeredAutomationsQuery>
{
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: GetTriggeredAutomationsQuery): Promise<string[]> {
    console.log('GetTriggeredAutomationsQueryHandler');

    const { card, update, automations } = query;
    const triggeredAutomationIds = [];
    for (const automation of automations) {
      const { trigger } = automation;
      const query = triggerIdToQueryHandlerMap['statusChange'];
      const res = await this.queryBus.execute(new query(card, update, trigger));
      if (res) {
        triggeredAutomationIds.push(automation.id);
      }
    }

    return triggeredAutomationIds;
  }
}

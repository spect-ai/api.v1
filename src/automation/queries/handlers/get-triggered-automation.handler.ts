import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { LoggingService } from 'src/logging/logging.service';
import { GetTriggeredCollectionAutomationsQuery } from '../impl';
import { triggerIdToQueryHandlerMapNew } from '../impl/is-triggered-v2.query';

@QueryHandler(GetTriggeredCollectionAutomationsQuery)
export class GetTriggeredCollectionAutomationsQueryHandler
  implements IQueryHandler<GetTriggeredCollectionAutomationsQuery>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('GetTriggeredCollectionAutomationsQueryHandler');
  }

  async execute(
    query: GetTriggeredCollectionAutomationsQuery,
  ): Promise<string[]> {
    try {
      const { collection, dataUpdate, caller, circle, dataSlug } = query;

      if (
        !circle.automationsIndexedByCollection ||
        !circle.automationsIndexedByCollection[collection.slug]
      ) {
        return [];
      }

      const triggeredAutomationIds = [];
      const automationIds =
        circle.automationsIndexedByCollection[collection.slug];

      for (const automationId of automationIds) {
        const automation = circle.automations[automationId];
        if (!automation || automation.disabled) continue;
        try {
          const { trigger } = automation;
          if (!trigger) continue;
          let query;
          if (trigger.subType)
            query =
              triggerIdToQueryHandlerMapNew[trigger.type][trigger.subType];
          else query = triggerIdToQueryHandlerMapNew[trigger.type];

          if (
            await this.queryBus.execute(
              new query(collection, dataUpdate, trigger, dataSlug),
            )
          )
            triggeredAutomationIds.push(automationId);
        } catch (error) {
          this.logger.error(error.message);
        }
      }
      return triggeredAutomationIds;
    } catch (e) {
      this.logger.error(e.message);
    }
  }
}

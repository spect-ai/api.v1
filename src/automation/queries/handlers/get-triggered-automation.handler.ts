import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { GetTriggeredAutomationsQuery } from '../impl';
import { triggerIdToQueryHandlerMap } from '../impl/is-triggered.query';

@QueryHandler(GetTriggeredAutomationsQuery)
export class GetTriggeredAutomationsQueryHandler
  implements IQueryHandler<GetTriggeredAutomationsQuery>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('GetTriggeredAutomationsQueryHandler');
  }

  async execute(query: GetTriggeredAutomationsQuery): Promise<string[]> {
    try {
      console.log('GetTriggeredAutomationsQueryHandler');

      const { performAutomationCommandContainer, caller } = query;
      const { automations } = performAutomationCommandContainer;
      const triggeredAutomationIds = [];
      for (const automation of Object.values(automations)) {
        try {
          const { trigger } = automation;
          const query = triggerIdToQueryHandlerMap[trigger.id];
          const res = await this.queryBus.execute(
            new query(performAutomationCommandContainer, trigger),
          );
          if (res) {
            triggeredAutomationIds.push(automation.id);
          }
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

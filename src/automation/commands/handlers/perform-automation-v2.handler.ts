import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import {
  GetTriggeredCollectionAutomationsQuery,
  HasSatisfiedDataConditionsQuery,
} from 'src/automation/queries/impl';
import { AutomationUpdatesContainer } from 'src/automation/types/types';
import { LoggingService } from 'src/logging/logging.service';
import {
  PerformAutomationOnCollectionDataAddCommand,
  PerformAutomationOnCollectionDataUpdateCommand,
} from '../impl';
import { actionIdToCommandMapNew } from '../impl/take-action-v2.command';

@CommandHandler(PerformAutomationOnCollectionDataUpdateCommand)
export class PerformAutomationOnCollectionDataUpdateCommandHandler
  implements ICommandHandler<PerformAutomationOnCollectionDataUpdateCommand>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setContext(
      PerformAutomationOnCollectionDataUpdateCommandHandler.name,
    );
  }

  async execute(
    command: PerformAutomationOnCollectionDataUpdateCommand,
  ): Promise<AutomationUpdatesContainer> {
    try {
      const { collection, dataUpdate, circle, caller, dataSlug } = command;

      const triggeredAutomations = await this.queryBus.execute(
        new GetTriggeredCollectionAutomationsQuery(
          collection,
          dataUpdate,
          caller,
          circle,
          dataSlug,
        ),
      );

      const dataContainer = {};
      const updateContainer = {
        collection: {},
        circle: {},
        user: {},
      };
      console.log({ triggeredAutomations });
      for (const automationId of triggeredAutomations) {
        const { actions } = circle.automations[automationId];
        console.log({ actions });
        for (const action of actions) {
          const actionCommand = actionIdToCommandMapNew[action.type];
          await this.commandBus.execute(
            new actionCommand(action, caller, dataContainer, updateContainer, {
              collectionSlug: collection.slug,
              dataSlug,
            }),
          );
        }
      }

      return updateContainer;
    } catch (error) {
      this.loggingService.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}

@CommandHandler(PerformAutomationOnCollectionDataAddCommand)
export class PerformAutomationOnCollectionDataAddCommandHandler
  implements ICommandHandler<PerformAutomationOnCollectionDataAddCommand>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setContext(
      PerformAutomationOnCollectionDataAddCommandHandler.name,
    );
  }

  async execute(
    command: PerformAutomationOnCollectionDataAddCommand,
  ): Promise<AutomationUpdatesContainer> {
    try {
      const { collection, data, dataSlug, circle, caller } = command;

      const automationIds =
        circle.automationsIndexedByCollection?.[collection?.slug];
      const triggeredAutomations =
        automationIds?.filter(
          (automationId) =>
            circle.automations[automationId].trigger?.type === 'newData' &&
            !circle.automations[automationId].disabled,
        ) || [];

      const dataContainer = {};
      const updateContainer = {
        collection: {},
        circle: {},
        retro: {},
      };
      console.log({ triggeredAutomations });
      const triggeredAutomationsSatisfiedConditions = [];
      for (const automationId of triggeredAutomations) {
        const { conditions } = circle.automations[automationId];
        if (!conditions) continue;
        const hasSatisfied = await this.queryBus.execute(
          new HasSatisfiedDataConditionsQuery(collection, data, conditions),
        );
        if (!hasSatisfied) continue;
        triggeredAutomationsSatisfiedConditions.push(automationId);
      }
      console.log({ triggeredAutomationsSatisfiedConditions });

      for (const automationId of triggeredAutomationsSatisfiedConditions) {
        const { actions } = circle.automations[automationId];
        console.log({ actions });
        for (const action of actions) {
          const actionCommand = actionIdToCommandMapNew[action.type];
          await this.commandBus.execute(
            new actionCommand(action, caller, dataContainer, updateContainer, {
              collectionSlug: collection.slug,
              dataSlug,
            }),
          );
        }
      }

      return updateContainer;
    } catch (error) {
      this.loggingService.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}

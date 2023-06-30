import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import {
  GetTriggeredCollectionAutomationsQuery,
  HasSatisfiedAdvancedDataConditionsQuery,
} from 'src/automation/queries/impl';
import { AutomationUpdatesContainer } from 'src/automation/types/types';
import { LoggingService } from 'src/logging/logging.service';
import {
  PerformAutomationOnCollectionDataAddCommand,
  PerformAutomationOnCollectionDataUpdateCommand,
  PerformAutomationOnPaymentCancelledCommand,
  PerformAutomationOnPaymentCompleteCommand,
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

      const dataContainer = {};
      const updateContainer = {
        collection: {},
        circle: {},
        user: {},
      };

      if (collection?.archived) return updateContainer;

      const triggeredAutomations = await this.queryBus.execute(
        new GetTriggeredCollectionAutomationsQuery(
          collection,
          dataUpdate,
          caller,
          circle,
          dataSlug,
        ),
      );

      const triggeredAutomationsSatisfiedConditions = [];
      for (const automationId of triggeredAutomations) {
        const { advancedConditions } = circle.automations[automationId];
        if (!advancedConditions || !advancedConditions?.order) {
          triggeredAutomationsSatisfiedConditions.push(automationId);
          continue;
        }
        const hasSatisfied = await this.queryBus.execute(
          new HasSatisfiedAdvancedDataConditionsQuery(
            collection,
            collection.data[dataSlug],
            advancedConditions,
          ),
        );
        if (!hasSatisfied) continue;
        triggeredAutomationsSatisfiedConditions.push(automationId);
      }

      console.log({ triggeredAutomationsSatisfiedConditions });

      for (const automationId of triggeredAutomationsSatisfiedConditions) {
        const { actions } = circle.automations[automationId];
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

      const dataContainer = {};
      const updateContainer = {
        collection: {},
        circle: {},
        retro: {},
      };

      if (collection?.archived) return updateContainer;

      const automationIds =
        circle.automationsIndexedByCollection?.[collection?.slug];
      const triggeredAutomations =
        automationIds?.filter(
          (automationId) =>
            circle.automations[automationId].trigger?.type === 'newData' &&
            !circle.automations[automationId].disabled,
        ) || [];

      console.log({ triggeredAutomations });
      const triggeredAutomationsSatisfiedConditions = [];
      for (const automationId of triggeredAutomations) {
        const { advancedConditions } = circle.automations[automationId];
        if (!advancedConditions || !advancedConditions?.order) {
          triggeredAutomationsSatisfiedConditions.push(automationId);
          continue;
        }
        const hasSatisfied = await this.queryBus.execute(
          new HasSatisfiedAdvancedDataConditionsQuery(
            collection,
            data,
            advancedConditions,
          ),
        );
        if (!hasSatisfied) continue;
        triggeredAutomationsSatisfiedConditions.push(automationId);
      }

      console.log({ triggeredAutomationsSatisfiedConditions });
      for (const automationId of triggeredAutomationsSatisfiedConditions) {
        const { actions } = circle.automations[automationId];
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

@CommandHandler(PerformAutomationOnPaymentCompleteCommand)
export class PerformAutomationOnPaymentCompleteCommandHandler
  implements ICommandHandler<PerformAutomationOnPaymentCompleteCommand>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setContext(
      PerformAutomationOnPaymentCompleteCommandHandler.name,
    );
  }

  async execute(
    command: PerformAutomationOnPaymentCompleteCommand,
  ): Promise<AutomationUpdatesContainer> {
    try {
      const { collection, data, dataSlug, circle, caller } = command;

      const dataContainer = {};
      const updateContainer = {
        collection: {},
        circle: {},
        retro: {},
      };

      if (collection?.archived) return updateContainer;

      const automationIds =
        circle.automationsIndexedByCollection?.[collection?.slug];
      const triggeredAutomations =
        automationIds?.filter(
          (automationId) =>
            circle.automations[automationId].trigger?.type ===
              'completedPayment' && !circle.automations[automationId].disabled,
        ) || [];

      const triggeredAutomationsSatisfiedConditions = [];
      for (const automationId of triggeredAutomations) {
        const { advancedConditions } = circle.automations[automationId];
        if (!advancedConditions || !advancedConditions.order) continue;
        console.log({ advancedConditions });
        const hasSatisfied = await this.queryBus.execute(
          new HasSatisfiedAdvancedDataConditionsQuery(
            collection,
            data,
            advancedConditions,
          ),
        );
        if (!hasSatisfied) continue;
        triggeredAutomationsSatisfiedConditions.push(automationId);
      }

      for (const automationId of triggeredAutomationsSatisfiedConditions) {
        const { actions } = circle.automations[automationId];
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

@CommandHandler(PerformAutomationOnPaymentCancelledCommand)
export class PerformAutomationOnPaymentCancelledCommandHandler
  implements ICommandHandler<PerformAutomationOnPaymentCancelledCommand>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setContext(
      PerformAutomationOnPaymentCancelledCommandHandler.name,
    );
  }

  async execute(
    command: PerformAutomationOnPaymentCancelledCommand,
  ): Promise<AutomationUpdatesContainer> {
    try {
      const { collection, data, dataSlug, circle, caller } = command;

      const dataContainer = {};
      const updateContainer = {
        collection: {},
        circle: {},
        retro: {},
      };

      if (collection?.archived) return updateContainer;

      const automationIds =
        circle.automationsIndexedByCollection?.[collection?.slug];
      const triggeredAutomations =
        automationIds?.filter(
          (automationId) =>
            circle.automations[automationId].trigger?.type ===
              'cancelledPayment' && !circle.automations[automationId].disabled,
        ) || [];

      const triggeredAutomationsSatisfiedConditions = [];
      for (const automationId of triggeredAutomations) {
        const { advancedConditions } = circle.automations[automationId];
        if (!advancedConditions || !advancedConditions.order) continue;
        const hasSatisfied = await this.queryBus.execute(
          new HasSatisfiedAdvancedDataConditionsQuery(
            collection,
            data,
            advancedConditions,
          ),
        );
        if (!hasSatisfied) continue;
        triggeredAutomationsSatisfiedConditions.push(automationId);
      }

      for (const automationId of triggeredAutomationsSatisfiedConditions) {
        const { actions } = circle.automations[automationId];
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

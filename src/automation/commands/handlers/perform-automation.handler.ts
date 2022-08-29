import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import {
  PerformAutomationCommand,
  PerformMultipleAutomationsCommand,
} from 'src/automation/commands/impl';
import { GetTriggeredAutomationsQuery } from 'src/automation/queries/impl';
import { HasSatisfiedConditionsQuery } from 'src/automation/queries/impl/has-satisfied-conditions.query';
import { MultipleItemContainer } from 'src/automation/types/types';
import { CardsRepository } from 'src/card/cards.repository';
import { Card, ExtendedCard } from 'src/card/model/card.model';
import { CommonTools } from 'src/common/common.service';
import { MappedItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { Project } from 'src/project/model/project.model';
import { actionIdToCommandMap } from '../impl/take-action.command';

@CommandHandler(PerformAutomationCommand)
export class PerformAutomationCommandHandler
  implements ICommandHandler<PerformAutomationCommand>
{
  constructor(
    private readonly commonTools: CommonTools,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(
    command: PerformAutomationCommand,
  ): Promise<MultipleItemContainer> {
    try {
      const { performAutomationCommandContainer, caller } = command;
      const { card, project, update } = performAutomationCommandContainer;

      const triggeredAutomations = await this.queryBus.execute(
        new GetTriggeredAutomationsQuery(
          performAutomationCommandContainer,
          caller,
        ),
      );
      // Need to fetch all the required data to check / update based on the conditions and actions here

      console.log('triggeredAutomations', triggeredAutomations);
      const automationIdsSatisfyingConditions = [];
      for (const automationId of triggeredAutomations) {
        const { conditions } = project.automations[automationId];
        const satisfied = await this.queryBus.execute(
          new HasSatisfiedConditionsQuery(
            performAutomationCommandContainer,
            caller,
            conditions,
          ),
        );
        if (!satisfied) continue;
        automationIdsSatisfyingConditions.push(automationId);
      }
      console.log(
        'automationIdsSatisfyingConditions',
        automationIdsSatisfyingConditions,
      );

      const returningMultipleItemContainer = {};
      for (const automationId of automationIdsSatisfyingConditions) {
        const { actions } = project.automations[automationId];
        for (const action of actions) {
          const actionCommand = actionIdToCommandMap[action.id];
          const res = (await this.commandBus.execute(
            new actionCommand(
              performAutomationCommandContainer,
              action,
              caller,
            ),
          )) as MultipleItemContainer;
          for (const [key, val] of Object.entries(res)) {
            if (returningMultipleItemContainer[key]) {
              returningMultipleItemContainer[key] =
                this.commonTools.mergeObjects(
                  returningMultipleItemContainer[key],
                  val as object,
                );
            } else {
              returningMultipleItemContainer[key] = val;
            }
          }
        }
      }

      return returningMultipleItemContainer;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

@CommandHandler(PerformMultipleAutomationsCommand)
export class PerformMultipleAutomationsCommandHandler
  implements ICommandHandler<PerformMultipleAutomationsCommand>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
  ) {
    this.logger.setContext('PerformMultipleAutomationsCommandHandler');
  }

  async execute(
    command: PerformMultipleAutomationsCommand,
  ): Promise<MultipleItemContainer> {
    try {
      const {
        cards,
        updates,
        cardIdToProject,
        cardIdToCircle,
        caller,
        cardCreated,
      } = command;

      let items: MultipleItemContainer = {};

      for (const update of updates) {
        if (!cardIdToProject[update.id]?.automations) {
          this.logger.log(
            `Couldn't retrieve automations for project ${
              cardIdToProject[update.id]
            }`,
          );
        }
        items = await this.commandBus.execute(
          new PerformAutomationCommand(
            {
              automations: cardIdToProject[update.id].automations || {},
              update,
              card: cards[update.id] as Card,
              project: cardIdToProject[update.id],
              circle: cardIdToCircle[update.id],
              misc: {
                cardCreated: cardCreated,
              },
            },
            caller,
          ),
        );
      }

      return items;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

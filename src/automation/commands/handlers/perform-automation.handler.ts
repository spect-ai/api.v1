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
import { CardsRepository } from 'src/card/cards.repository';
import { Card, ExtendedCard } from 'src/card/model/card.model';
import { MappedItem } from 'src/common/interfaces';
import { Project } from 'src/project/model/project.model';
import { actionIdToCommandMap } from '../impl/take-action.command';

@CommandHandler(PerformAutomationCommand)
export class PerformAutomationCommandHandler
  implements ICommandHandler<PerformAutomationCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: PerformAutomationCommand): Promise<{
    card: Card | ExtendedCard;
    project: Project;
  }> {
    try {
      const { update, card, project } = command;
      const triggeredAutomations = await this.queryBus.execute(
        new GetTriggeredAutomationsQuery(
          card,
          update,
          Object.values(project.automations),
        ),
      );
      let conditions = [];
      let actions = [];
      for (const automationId of triggeredAutomations) {
        conditions = [
          ...project.automations[automationId].conditions,
          ...conditions,
        ];
        actions = [...project.automations[automationId].actions, ...actions];
      }

      // Need to fetch all the required data to check / update based on the conditions and actions here

      const automationIdsSatisfyingConditions = [];
      for (const automationId of triggeredAutomations) {
        const { conditions } = project.automations[automationId];
        const satisfied = await this.queryBus.execute(
          new HasSatisfiedConditionsQuery(card, conditions),
        );
        if (!satisfied) continue;
        automationIdsSatisfyingConditions.push(automationId);
      }

      for (const automationId of automationIdsSatisfyingConditions) {
        const { actions } = project.automations[automationId];
        for (const action of actions) {
          const actionCommand = actionIdToCommandMap[action.id];
          this.commandBus.execute(
            actionCommand(card, action, {
              project,
            }),
          );
        }
      }

      return { card, project };
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
    private readonly cardsRepository: CardsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: PerformMultipleAutomationsCommand): Promise<{
    cards: MappedItem<Card>;
    projects: MappedItem<Project>;
  }> {
    try {
      const { updates, cards, projects } = command;

      const updatedCards = {};
      const updatedProjects = {};

      for (const cardId of Object.keys(updates)) {
        const { card, project } = await this.commandBus.execute(
          new PerformAutomationCommand(
            updates[cardId] as Partial<Card>,
            cards[cardId] as Card,
            projects[cardId] as Project,
          ),
        );
      }

      return {
        cards: updatedCards,
        projects: updatedProjects,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

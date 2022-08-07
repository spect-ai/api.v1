import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  PerformAutomationCommand,
  PerformMultipleAutomationsCommand,
} from 'src/automation/commands/impl';
import { CardsRepository } from 'src/card/cards.repository';
import { Card, ExtendedCard } from 'src/card/model/card.model';
import { MappedItem } from 'src/common/interfaces';
import { Project } from 'src/project/model/project.model';

@CommandHandler(PerformAutomationCommand)
export class PerformAutomationCommandHandler
  implements ICommandHandler<PerformAutomationCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: PerformAutomationCommand): Promise<{
    card: Card | ExtendedCard;
    project: Project;
  }> {
    try {
      const { update, card, project } = command;

      return {
        card,
        project,
      };
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

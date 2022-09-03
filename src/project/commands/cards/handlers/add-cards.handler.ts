import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CardsRepository } from 'src/card/cards.repository';
import { LoggingService } from 'src/logging/logging.service';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { AddCardsCommand, AddCardsInMultipleProjectsCommand } from '../../impl';

@CommandHandler(AddCardsCommand)
export class AddCardsCommandHandler
  implements ICommandHandler<AddCardsCommand>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly cardsRepository: CardsRepository,
  ) {}

  async execute(command: AddCardsCommand): Promise<Project> {
    try {
      const { project, id, cards, lastCardCount } = command;
      let projectToUpdate = project;
      if (!projectToUpdate) {
        projectToUpdate = await this.projectRepository.findById(id);
      }
      if (!projectToUpdate) {
        throw new InternalServerErrorException('Project not found');
      }

      const cardIds = [];
      const columnDetails = { ...projectToUpdate.columnDetails };
      if (Object.keys(columnDetails).length === 0) {
        throw new Error('No columns found');
      }
      for (const card of cards) {
        if (!projectToUpdate.cards.includes(card._id.toString())) {
          cardIds.push(card._id);
          if (card.columnId in columnDetails) {
            columnDetails[card.columnId].cards = [
              card._id.toString(),
              ...columnDetails[card.columnId].cards,
            ];
          } else {
            columnDetails[projectToUpdate.columnOrder[0]].cards = [
              card._id.toString(),
              ...columnDetails[projectToUpdate.columnOrder[0]].cards,
            ];
            await this.cardsRepository.updateById(card._id.toString(), {
              columnId: projectToUpdate.columnOrder[0],
            });
          }
        }
      }

      const updatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          projectToUpdate.id,
          {
            cards: [...cardIds, ...projectToUpdate.cards],
            columnDetails: columnDetails,
            cardCount: lastCardCount || projectToUpdate.cardCount,
          },
        );
      return updatedProject;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}

@CommandHandler(AddCardsInMultipleProjectsCommand)
export class AddCardsInMultipleProjectsCommandHandler
  implements ICommandHandler<AddCardsInMultipleProjectsCommand>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AddCardsInMultipleProjectsCommandHandler');
  }

  async execute(command: AddCardsInMultipleProjectsCommand): Promise<boolean> {
    try {
      const { projectIdToCards } = command;

      for (const [projectId, cards] of Object.entries(projectIdToCards)) {
        try {
          await this.commandBus.execute(
            new AddCardsCommand(cards, null, projectId),
          );
        } catch (error) {
          this.logger.error(error.message);
        }
      }
      return true;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}

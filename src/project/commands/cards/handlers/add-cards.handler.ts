import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { AddCardsCommand } from '../../impl';

@CommandHandler(AddCardsCommand)
export class AddCardsCommandHandler
  implements ICommandHandler<AddCardsCommand>
{
  constructor(private readonly projectRepository: ProjectsRepository) {}

  async execute(command: AddCardsCommand): Promise<Project> {
    try {
      const { project, id, cards } = command;
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
        }
      }

      const updatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          projectToUpdate.id,
          {
            cards: [...cardIds, ...projectToUpdate.cards],
            columnDetails: columnDetails,
          },
        );
      return updatedProject;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}

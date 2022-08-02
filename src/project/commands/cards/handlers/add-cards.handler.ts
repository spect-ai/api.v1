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
      const { project, cards, caller } = command;

      const cardIds = [];
      const columnDetails = { ...project.columnDetails };
      for (const card of cards) {
        cardIds.push(card._id);
        columnDetails[card.columnId].cards = [
          card._id.toString(),
          ...columnDetails[card.columnId].cards,
        ];
      }

      const updatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          project.id,
          {
            cards: [...cardIds, ...project.cards],
            columnDetails: columnDetails,
          },
        );
      return updatedProject;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}

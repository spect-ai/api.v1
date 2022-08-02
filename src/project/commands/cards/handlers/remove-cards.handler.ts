import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { RemoveCardsCommand } from '../../impl';

@CommandHandler(RemoveCardsCommand)
export class RemoveCardsCommandHandler
  implements ICommandHandler<RemoveCardsCommand>
{
  constructor(private readonly projectRepository: ProjectsRepository) {}

  async execute(command: RemoveCardsCommand): Promise<Project> {
    try {
      const { project, id, cardIds } = command;
      let projectToUpdate = project;

      if (!projectToUpdate) {
        projectToUpdate = await this.projectRepository.findById(id);
      }

      if (!projectToUpdate) {
        throw new InternalServerErrorException('Project not found');
      }

      const columnDetails = { ...projectToUpdate.columnDetails };
      for (const columnId in columnDetails) {
        const cards = columnDetails[columnId].cards;
        columnDetails[columnId].cards = cards.filter(
          (cardId) => !cardIds.includes(cardId),
        );
      }

      const cards = projectToUpdate.cards.filter(
        (cardId) => !cardIds.includes(cardId),
      );

      const updatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          projectToUpdate.id,
          {
            columnDetails,
            cards,
          },
        );
      return updatedProject;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}

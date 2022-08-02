import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { RemoveCardsCommand } from '../../impl';
import { RemoveItemsCommand } from '../impl/remove-items.command';

@CommandHandler(RemoveItemsCommand)
export class RemoveItemsCommandHandler
  implements ICommandHandler<RemoveItemsCommand>
{
  constructor(private readonly projectRepository: ProjectsRepository) {}

  async execute(command: RemoveItemsCommand): Promise<Project> {
    try {
      const { project, id, items } = command;
      let projectToUpdate = project;
      if (!projectToUpdate) {
        projectToUpdate = await this.projectRepository.findById(id);
      }
      if (!projectToUpdate) {
        throw new InternalServerErrorException('Project not found');
      }

      for (const item of items) {
        projectToUpdate[item.fieldName] = projectToUpdate[
          item.fieldName
        ].filter((cardId) => !item.itemIds.includes(cardId));
      }
      const updatedProject = await this.projectRepository.updateById(
        project.id,
        projectToUpdate,
      );
      return updatedProject;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}

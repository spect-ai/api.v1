import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { ArchiveMultipleCardsByIdCommand } from 'src/card/commands/impl';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { GetProjectByIdQuery } from 'src/project/queries/impl';
import { ArchiveProjectCommand } from '../impl';

@CommandHandler(ArchiveProjectCommand)
export class ArchiveProjectCommandHandler
  implements ICommandHandler<ArchiveProjectCommand>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: ArchiveProjectCommand): Promise<Project> {
    try {
      const { id } = command;
      const projectToUpdate = await this.queryBus.execute(
        new GetProjectByIdQuery(id),
      );
      console.log(projectToUpdate);
      if (!projectToUpdate) {
        throw new InternalServerErrorException('Project not found');
      }

      await this.commandBus.execute(
        new ArchiveMultipleCardsByIdCommand(projectToUpdate.cards, false),
      );
      const updatedProject = await this.projectRepository.updateById(
        projectToUpdate.id,
        {
          status: {
            ...(projectToUpdate.status || {}),
            active: false,
            archived: true,
          },
        },
      );
      return updatedProject;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}

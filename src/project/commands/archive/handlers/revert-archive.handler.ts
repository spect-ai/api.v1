import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { RevertArchivalMultipleCardsByIdCommand } from 'src/card/commands/impl';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { GetProjectByIdQuery } from 'src/project/queries/impl';
import { RevertArchivedProjectCommand } from '../impl';

@CommandHandler(RevertArchivedProjectCommand)
export class RevertArchivedProjectCommandHandler
  implements ICommandHandler<RevertArchivedProjectCommand>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: RevertArchivedProjectCommand): Promise<Project> {
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
        new RevertArchivalMultipleCardsByIdCommand(
          projectToUpdate.cards,
          false,
        ),
      );
      const updatedProject = await this.projectRepository.updateById(
        projectToUpdate.id,
        {
          status: {
            ...(projectToUpdate.status || {}),
            active: true,
            archived: false,
          },
        },
      );
      return updatedProject;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}

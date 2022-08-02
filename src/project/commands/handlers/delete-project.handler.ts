import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteMultipleCardsByIdCommand } from 'src/card/commands/impl';
import { RemoveProjectsFromMultipleCirclesCommand } from 'src/circle/commands/impl';
import { DeleteProjectByIdCommand } from 'src/project/commands/impl';
import { ProjectsRepository } from 'src/project/project.repository';

@CommandHandler(DeleteProjectByIdCommand)
export class DeleteCardByIdCommandHandler
  implements ICommandHandler<DeleteProjectByIdCommand>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: DeleteProjectByIdCommand): Promise<boolean> {
    try {
      let projectToDelete = command.project;
      if (!projectToDelete) {
        projectToDelete = await this.projectRepository.findById(command.id);
      }
      if (!projectToDelete) {
        throw new InternalServerErrorException(
          `Could not find project with id ${command.id}`,
        );
      }

      await this.commandBus.execute(
        new DeleteMultipleCardsByIdCommand(projectToDelete.cards, true, false),
      );
      await this.projectRepository.deleteOne({
        _id: command.id,
      });

      await this.commandBus.execute(
        new RemoveProjectsFromMultipleCirclesCommand(
          [projectToDelete.id],
          null,
          projectToDelete.parents,
        ),
      );
      return true;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

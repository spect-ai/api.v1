import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { LoggingService } from 'src/logging/logging.service';
import { CreateGrantWorkflowCommand } from '../impl/index';
import { v4 as uuidv4 } from 'uuid';
import { CollectionRepository } from 'src/collection/collection.repository';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { CreateFolderCommand } from 'src/circle/commands/impl';
import { getKanbanProjectDetails } from '../utils';
import { KanbanProjectCommand } from '../impl/kanban-project.command';
import { RegistryService } from 'src/registry/registry.service';

@CommandHandler(KanbanProjectCommand)
export class KanbanProjectCommandHandler
  implements ICommandHandler<KanbanProjectCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly registryService: RegistryService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(KanbanProjectCommandHandler.name);
  }

  async execute(command: CreateGrantWorkflowCommand): Promise<Circle> {
    try {
      const { id, templateDto, caller } = command;
      const circle: Circle = await this.queryBus.execute(
        new GetCircleByIdQuery(id, {}),
      );

      const registry = await this.registryService.getRegistry();

      // 1. Create Kanban project
      const projectViewId = uuidv4();
      const kanbanProjectDto = getKanbanProjectDetails(
        circle,
        projectViewId,
        templateDto.registry || { '137': registry?.['137'] },
      );
      const kanbanProject = await this.collectionRepository.create({
        creator: caller,
        parents: [id],
        slug: uuidv4(),
        ...kanbanProjectDto,
      } as any);

      // 2. Update the circle
      await this.commandBus.execute(
        new UpdateCircleCommand(
          id,
          {
            collections: [...(circle.collections || []), kanbanProject.id],
          },
          caller,
        ),
      );

      // 3. Create a Folder
      const updatedCircle = await this.commandBus.execute(
        new CreateFolderCommand(id, {
          name: 'Kanban Project',
          avatar: 'Kanban Project',
          contentIds: [kanbanProject.id],
        }),
      );

      return updatedCircle;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}

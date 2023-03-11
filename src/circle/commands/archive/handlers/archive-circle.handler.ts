import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DeleteCircleByIdCommand } from 'src/circle/commands/impl';
import { GetCircleWithAllRelationsQuery } from 'src/circle/queries/impl';
import { LoggingService } from 'src/logging/logging.service';
import { ArchiveCircleByIdCommand } from '../impl/archive-circle.command';

@CommandHandler(ArchiveCircleByIdCommand)
export class ArchiveCircleByIdCommandHandler
  implements ICommandHandler<DeleteCircleByIdCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('ArchiveCircleByIdCommandHandler');
  }

  async execute(command: ArchiveCircleByIdCommand): Promise<boolean> {
    try {
      const { id } = command;
      const circleWithRelations = await this.queryBus.execute(
        new GetCircleWithAllRelationsQuery(id, null, 1),
      );
      if (!circleWithRelations || circleWithRelations.length === 0) {
        throw new InternalServerErrorException(
          `Could not find circle with id ${command.id}`,
        );
      }
      const circlesToArchive = [
        ...circleWithRelations.flattenedChildren,
        circleWithRelations,
      ];
      const circlesUpdates = {};
      for (const circleToArchive of circlesToArchive) {
        circlesUpdates[circleToArchive.id] = {
          status: {
            ...(circleToArchive.status || {}),
            archived: true,
          },
        };
      }
      for (const parentCircle of circleWithRelations.flattenedParents) {
        circlesUpdates[parentCircle.id] = {
          children: parentCircle.children.filter(
            (child) => child.toString() !== id,
          ),
        };
      }

      await this.circlesRepository.bundleAndExecuteUpdates(circlesUpdates);

      return true;
    } catch (error) {
      this.logger.error(error.message);
      return false;
    }
  }
}

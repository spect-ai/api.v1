import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { CommonTools } from 'src/common/common.service';
import { CreateCollectionCommand } from '../impl/create-collection.command';
import { v4 as uuidv4 } from 'uuid';
import { MappedItem } from 'src/common/interfaces';
import { Property } from 'src/collection/types/types';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { LoggingService } from 'src/logging/logging.service';
import { InternalServerErrorException } from '@nestjs/common';

@CommandHandler(CreateCollectionCommand)
export class CreateCollectionCommandHandler
  implements ICommandHandler<CreateCollectionCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly commonTools: CommonTools,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CreateCollectionCommandHandler');
  }

  async execute(command: CreateCollectionCommand): Promise<Collection> {
    try {
      const { createCollectionDto, caller } = command;

      let properties = {} as MappedItem<Property>;
      if (createCollectionDto.properties) {
        properties = this.commonTools.objectify(
          createCollectionDto.properties,
          'name',
        ) as MappedItem<Property>;
      }
      const parentCircle = await this.queryBus.execute(
        new GetCircleByIdQuery(createCollectionDto.circleId),
      );

      if (!parentCircle)
        throw `Circle with id ${createCollectionDto.circleId} not found`;

      const createdCollection = await this.collectionRepository.create({
        ...createCollectionDto,
        properties,
        creator: caller,
        parents: [createCollectionDto.circleId],
        slug: uuidv4(),
      });

      await this.commandBus.execute(
        new UpdateCircleCommand(
          parentCircle.id,
          {
            collections: [
              ...(parentCircle.collections || []),
              createdCollection.id,
            ],
          },
          caller,
        ),
      );

      return createdCollection;
    } catch (err) {
      this.logger.error(`Failed creating collection with error ${err.message}`);
      throw new InternalServerErrorException(
        `Failed creating collection with error ${err.message}`,
      );
    }
  }
}

import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { CreateCollectionCommand } from '../impl/create-collection.command';
import { v4 as uuidv4 } from 'uuid';
import { MappedItem } from 'src/common/interfaces';
import { Property } from 'src/collection/types/types';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { LoggingService } from 'src/logging/logging.service';
import { InternalServerErrorException } from '@nestjs/common';
import { CollectionCreatedEvent } from 'src/collection/events';
import { Circle } from 'src/circle/model/circle.model';
import { MigrateCollectionCommand } from '../impl/migrate-collection.command';
import { ProjectsRepository } from 'src/project/project.repository';

@CommandHandler(MigrateCollectionCommand)
export class MigrateCollectionCommandHandler
  implements ICommandHandler<MigrateCollectionCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly projectRepository: ProjectsRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CreateCollectionCommandHandler');
  }

  async execute(command: MigrateCollectionCommand): Promise<Collection> {
    try {
      const { projectId, caller } = command;

      const project = await this.projectRepository.findById(projectId);

      const properties = {
        Title: {
          name: 'Title',
          type: 'shortText',
          default: '',
          isPartOfFormView: true,
          immutable: true,
        },
        Description: {
          name: 'Description',
          type: 'longText',
          default: '',
          isPartOfFormView: true,
        },
        Status: {
          name: 'Status',
          type: 'singleSelect',
          default: {},
          options: [
            {
              label: 'To Do',
              value: uuidv4(),
            },
            {
              label: 'In Progress',
              value: uuidv4(),
            },
            {
              label: 'Done',
              value: uuidv4(),
            },
          ],
          isPartOfFormView: false,
        },
      } as MappedItem<Property>;
      const propertyOrder = ['Title', 'Description', 'Status'];

      const parentCircle: Circle = await this.queryBus.execute(
        new GetCircleByIdQuery(project.parents[0], {}),
      );

      if (!parentCircle) throw `Circle with id ${project.parents[0]} not found`;

      const defaultViewId = '0x0';
      const createdCollection = await this.collectionRepository.create({
        properties,
        propertyOrder,
        creator: caller,
        parents: project.parents,
        slug: uuidv4(),
        projectMetadata: {
          viewOrder: [defaultViewId],
          views: {
            [defaultViewId]: {
              id: defaultViewId,
              name: 'Default View',
              type: 'grid',
              filters: [],
              sort: {
                property: '',
                direction: 'asc',
              },
            },
          },
          cardOrders: {},
        },
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

      this.eventBus.publish(
        new CollectionCreatedEvent(createdCollection, caller),
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

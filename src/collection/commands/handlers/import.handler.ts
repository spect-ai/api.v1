import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import { ImportCommand } from '../impl/import.command';
import { v4 as uuidv4 } from 'uuid';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { AddMultipleDataUsingAutomationCommand } from '../data/impl/add-data.command';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { CreateFolderCommand } from 'src/circle/commands/impl';
import { Collection } from 'src/collection/model/collection.model';
import { UpdateCollectionCommand } from '../impl/update-collection.command';

@CommandHandler(ImportCommand)
export class ImportCommandHandler implements ICommandHandler<ImportCommand> {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('ImportCommandHandler');
  }

  async execute(command: ImportCommand): Promise<any> {
    try {
      const {
        data,
        collectionId,
        collectionProperties,
        groupByColumn,
        caller,
        circleId,
      } = command;
      console.log({
        data,
        collectionId,
        collectionProperties,
        groupByColumn,
      });

      const parentCircle: Circle = await this.queryBus.execute(
        new GetCircleByIdQuery(circleId, {}),
      );

      if (!parentCircle) throw `Circle with id ${circleId} not found`;
      // give default permissions to roles which have createForm permission
      const defaultPermissions = {
        manageSettings: [],
        updateResponsesManually: [],
        viewResponses: [],
        addComments: [],
      };

      Object.keys(parentCircle.roles).map((role) => {
        if (parentCircle.roles[role].permissions.createNewForm) {
          defaultPermissions.manageSettings.push(role);
          defaultPermissions.updateResponsesManually.push(role);
          defaultPermissions.viewResponses.push(role);
          defaultPermissions.addComments.push(role);
        }
      });

      const defaultViewId = '0x0';

      const createdCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          collectionType: 1,
          properties: collectionProperties,
          propertyOrder: Object.keys(collectionProperties),
          creator: caller,
          parents: [circleId],
          slug: uuidv4(),
          permissions: defaultPermissions,
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
        },
      );

      const updatedCollection: Collection = await this.commandBus.execute(
        new AddMultipleDataUsingAutomationCommand(data, createdCollection.id),
      );

      const kanbanView = '0x1';
      const cardColumnOrder: Array<Array<string>> = Array.from(
        {
          length:
            (collectionProperties[groupByColumn].options?.length || 0) + 1,
        },
        () => [],
      );
      const cardOrders = {};

      Object.keys(updatedCollection.data).forEach((key) => {
        const row = updatedCollection.data[key] as any;
        const columnValue = row[groupByColumn];
        const columnIndex = collectionProperties[
          groupByColumn
        ].options?.findIndex(
          (option) => option.value === columnValue?.value,
        ) as number;
        cardColumnOrder[columnIndex + 1].push(row.slug);
      });
      cardOrders[groupByColumn] = cardColumnOrder;

      const updatedCollectionWithKanbanView = await this.commandBus.execute(
        new UpdateCollectionCommand(
          {
            projectMetadata: {
              views: {
                ...updatedCollection.projectMetadata.views,
                [kanbanView]: {
                  id: kanbanView,
                  name: 'Kanban View',
                  type: 'kanban',
                  groupByColumn: groupByColumn,
                  filters: [],
                  sort: {
                    property: '',
                    direction: 'asc',
                  },
                },
              },
              viewOrder: [
                kanbanView,
                ...updatedCollection.projectMetadata.viewOrder,
              ],
              cardOrders,
            },
          },
          caller,
          createdCollection.id,
        ),
      );

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
      return {
        collection: updatedCollectionWithKanbanView,
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}

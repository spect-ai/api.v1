import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { v4 as uuidv4 } from 'uuid';
import { MappedItem } from 'src/common/interfaces';
import { Property } from 'src/collection/types/types';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { LoggingService } from 'src/logging/logging.service';
import { InternalServerErrorException } from '@nestjs/common';
import { CollectionCreatedEvent } from 'src/collection/events';
import { MigrateCollectionCommand } from '../impl/migrate-collection.command';
import { GetProjectByIdQuery } from 'src/project/queries/impl';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { Project } from 'src/project/model/project.model';
import { Circle } from 'src/circle/model/circle.model';
import { Card } from 'src/card/model/card.model';

@CommandHandler(MigrateCollectionCommand)
export class MigrateCollectionCommandHandler
  implements ICommandHandler<MigrateCollectionCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
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

      const project: Project = await this.queryBus.execute(
        new GetProjectByIdQuery(projectId),
      );
      console.log({ project: JSON.stringify(project, null, 2) });
      const circle: Circle = await this.queryBus.execute(
        new GetCircleByIdQuery(project.parents[0]),
      );

      const statusOptions = project.columnOrder.map((column) => ({
        label: project.columnDetails[column].name,
        value: column,
      }));

      const properties = {
        Title: {
          name: 'Title',
          type: 'shortText',
          default: '',
          isPartOfFormView: false,
          immutable: true,
        },
        Description: {
          name: 'Description',
          type: 'longText',
          default: '',
          isPartOfFormView: false,
        },
        Status: {
          name: 'Status',
          type: 'singleSelect',
          default: {},
          options: statusOptions,
          isPartOfFormView: false,
        },
        Start_Date: {
          name: 'StartDate',
          type: 'date',
          default: '',
          isPartOfFormView: false,
        },
        Deadline: {
          name: 'Deadline',
          type: 'date',
          default: '',
          isPartOfFormView: false,
        },
        Reward: {
          name: 'Reward',
          type: 'reward',
          isPartOfFormView: false,
        },
        Assignee: {
          name: 'Assignee',
          type: 'user[]',
          isPartOfFormView: false,
        },
        Reviewer: {
          name: 'Reviewer',
          type: 'user[]',
          isPartOfFormView: false,
        },
        Labels: {
          name: 'Labels',
          type: 'multiSelect',
          isPartOfFormView: false,
          options: circle.labels.map((label) => ({
            label: label,
            value: uuidv4(),
          })),
        },
        Priority: {
          name: 'Priority',
          type: 'singleSelect',
          isPartOfFormView: false,
          options: [
            {
              label: 'Low',
              value: uuidv4(),
            },
            {
              label: 'Medium',
              value: uuidv4(),
            },
            {
              label: 'High',
              value: uuidv4(),
            },
            {
              label: 'Urgent',
              value: uuidv4(),
            },
          ],
        },
      } as MappedItem<Property>;
      const propertyOrder = [
        'Title',
        'Description',
        'Status',
        'Start_Date',
        'Deadline',
        'Reward',
        'Assignee',
        'Reviewer',
        'Labels',
        'Priority',
      ];

      const views: any = project.viewDetails;

      for (const viewId in views) {
        views[viewId] = {
          name: views[viewId].name,
          type: views[viewId].type === 'Board' ? 'kanban' : 'list',
          groupByColumn: 'Status',
          sort: {
            property: '',
            direction: 'asc',
          },
          filters: Object.keys(views[viewId].filters).map((key) => {
            switch (key) {
              case 'assignee':
              case 'reviewer':
              case 'labels':
                return {
                  id: uuidv4(),
                  service: 'collection',
                  type: 'data',
                  data: {
                    field: {
                      label: key.replace(/^\w/, (c) => c.toUpperCase()),
                      value: key.replace(/^\w/, (c) => c.toUpperCase()),
                    },
                    comparator: {
                      label: 'includes one of',
                      value: 'includes one of',
                    },
                    value: views[viewId].filters[key].map((user) => ({
                      label: user,
                      value: user,
                    })),
                  },
                };
              default:
                return undefined;
            }
          }),
        };
      }

      console.log({ views: JSON.stringify(views, null, 2) });

      const data: any = {};
      const projectCards = project.cards as any as Card[];
      for (const card of projectCards) {
        data[card.id] = {
          Title: card.title,
          Description: card.description,
          Status: card.status,
          Start_Date: card.startDate,
          Deadline: card.deadline,
          Reward: card.reward,
          Assignee: card.assignee,
          Reviewer: card.reviewer,
          Labels: card.labels,
          Priority: card.priority,
          slug: card.id,
        };
      }

      const dataActivities: any = {};

      // Object.keys(data).map((cardId) => {
      //   dataActivities[cardId] = {
      //     comment: project.cards[cardId].activity
      //   };
      // })

      const defaultViewId = '0x0';
      const createdCollection = await this.collectionRepository.create({
        name: project.name,
        description: project.description,
        collectionType: 1,
        defaultView: 'table',
        properties,
        propertyOrder,
        creator: caller,
        parents: [(project.parents[0] as any).id],
        slug: uuidv4(),
        data,
        projectMetadata: {
          viewOrder: [defaultViewId, ...project.viewOrder],
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
            ...views,
          },
          cardOrders: {
            Status: project.columnOrder.map((column) => [
              ...project.columnDetails[column].cards,
            ]),
          },
        },
      });

      console.log(
        project.columnOrder.map((column) => [
          ...project.columnDetails[column].cards,
        ]),
      );

      await this.commandBus.execute(
        new UpdateCircleCommand(
          circle.id,
          {
            collections: [...(circle.collections || []), createdCollection.id],
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

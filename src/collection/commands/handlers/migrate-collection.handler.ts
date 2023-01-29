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
import { GetProjectByIdQuery } from 'src/project/queries/impl';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { Project } from 'src/project/model/project.model';
import { Circle } from 'src/circle/model/circle.model';
import { Card } from 'src/card/model/card.model';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { CommonTools } from 'src/common/common.service';
import { CirclesRepository } from 'src/circle/circles.repository';
import {
  MigrateAllCollectionsCommand,
  MigrateProjectCommand,
} from '../impl/migrate-collection.command';
import { UpdateFolderCommand } from 'src/circle/commands/impl';

@CommandHandler(MigrateProjectCommand)
export class MigrateCollectionCommandHandler
  implements ICommandHandler<MigrateProjectCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly commonTools: CommonTools,
    private readonly circlesRepository: CirclesRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CreateCollectionCommandHandler');
  }

  async execute(command: MigrateProjectCommand): Promise<Collection> {
    try {
      const { projectId, caller } = command;

      const project: Project = await this.queryBus.execute(
        new GetProjectByIdQuery(projectId),
      );
      const circle: Circle = await this.queryBus.execute(
        new GetCircleByIdQuery(project.parents[0]),
      );

      console.log({ projectId }, project.parents);
      const circles = await this.circlesRepository
        .findAll(
          {
            _id: { $in: project.parents },
          },
          {
            projection: {
              members: 1,
            },
          },
        )
        .populate('members');
      let res = this.commonTools.arrayify(circles, 'members');
      res = this.commonTools.distinctify(res, 'id');
      const memberDetails = this.commonTools.objectify(res, 'id');
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
            value: label,
          })),
        },
        Priority: {
          name: 'Priority',
          type: 'singleSelect',
          isPartOfFormView: false,
          options: [
            {
              label: 'Low',
              value: 'low',
            },
            {
              label: 'Medium',
              value: 'medium',
            },
            {
              label: 'High',
              value: 'high',
            },
            {
              label: 'Urgent',
              value: 'urgent',
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
          filters: {},
        };
      }

      const data: any = {};
      const projectCards = project.cards as any as Card[];

      for (const card of projectCards) {
        const cardColumn = project.columnOrder
          .map((column) => {
            if (
              project.columnDetails[column].cards.findIndex(
                (c) => c === card.id,
              ) !== -1
            )
              return column;
          })
          .filter((c) => c)[0];
        data[card.id] = {
          Title: card.title,
          Description: card.description,
          Status: {
            label: project.columnDetails[cardColumn].name,
            value: cardColumn,
          },
          Start_Date: card.startDate,
          Deadline: card.deadline,
          Reward: {
            ...card.reward,
            chain: {
              label: card.reward.chain.name,
              value: card.reward.chain.chainId,
            },
            token: {
              label: card.reward.token.symbol,
              value: card.reward.token.address,
            },
          },
          Assignee: card.assignee.map((assignee) => {
            return {
              label: memberDetails[assignee].username,
              value: assignee,
            };
          }),
          Reviewer: card.reviewer.map((reviewer) => {
            return {
              label: memberDetails[reviewer].username,
              value: reviewer,
            };
          }),
          Labels: card.labels.map((label) => {
            return {
              label: label,
              value: label,
            };
          }),
          Priority: {
            label: this.getCardPriorityLabel(card.priority || 0),
            value: this.getCardPriorityLabel(card.priority || 0).toLowerCase(),
          },
          slug: card.id,
        };
      }

      const dataActivities: any = {};
      const dataActivityOrder: any = {};
      const dataOwner: any = {};

      for (const card of projectCards) {
        console.log({ activity: JSON.stringify(card) });
        const activityId = uuidv4();
        dataActivities[card.id] = {
          [activityId]: {
            comment: false,
            content: 'created new row',
            ref: {
              actor: card.activity[0].actorId,
              type: 'user',
            },
            timestamp: card.activity[0].timestamp,
          },
        };
        dataActivityOrder[card.id] = [activityId];
        dataOwner[card.id] = card.activity[0].actorId;
      }

      const defaultViewId = '0x0';
      const newCollection = await this.collectionRepository.create({
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
        dataOwner,
        dataActivities,
        dataActivityOrder,
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
              ...project.columnDetails[column].cards
                .map((card) => {
                  if (project.cards.find((c: any) => c.id === card)) {
                    return card;
                  } else {
                    return undefined;
                  }
                })
                .filter((card) => card !== undefined),
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
            collections: [...(circle.collections || []), newCollection.id],
          },
          caller,
        ),
      );

      // find the folder id of the project and add the new collection to it
      const folderId = circle.folderOrder.find((folder) =>
        circle.folderDetails[folder].contentIds.includes(project.id),
      );

      await this.commandBus.execute(
        new UpdateFolderCommand(circle.id, folderId, {
          contentIds: [
            ...circle.folderDetails[folderId].contentIds,
            newCollection.id,
          ],
        }),
      );

      this.eventBus.publish(new CollectionCreatedEvent(newCollection, caller));

      const createdCollection = await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(newCollection.slug),
      );

      return createdCollection;
    } catch (err) {
      console.log({ err });
      this.logger.error(`Failed creating collection with error ${err.message}`);
      throw new InternalServerErrorException(
        `Failed creating collection with error ${err.message}`,
      );
    }
  }

  getCardPriorityLabel(prio: number) {
    if (prio === 0) {
      return 'Low';
    } else if (prio === 1) {
      return 'Medium';
    } else if (prio === 2) {
      return 'High';
    } else if (prio === 3) {
      return 'Urgent';
    } else {
      return 'Low';
    }
  }
}

@CommandHandler(MigrateAllCollectionsCommand)
export class MigrateAllCollectionsCommandHandler
  implements ICommandHandler<MigrateAllCollectionsCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly commonTools: CommonTools,
  ) {}

  async execute(command: MigrateAllCollectionsCommand) {
    const allCollections = await this.collectionRepository.findAll();

    for (const collection of allCollections) {
      if (
        collection.permissions === undefined ||
        collection.permissions?.manageSettings === undefined
      ) {
        console.log({ name: collection.name, id: collection.id });
        const defaultPermissions = {
          manageSettings: [],
          updateResponsesManually: [],
          viewResponses: [],
          addComments: [],
        };

        const parentCircle = await this.queryBus.execute(
          new GetCircleByIdQuery(collection.parents[0]),
        );

        Object.keys(parentCircle.roles).map((role) => {
          if (parentCircle.roles[role].permissions.createNewForm) {
            defaultPermissions.manageSettings.push(role);
            defaultPermissions.updateResponsesManually.push(role);
            defaultPermissions.viewResponses.push(role);
            defaultPermissions.addComments.push(role);
          }
        });
        collection.permissions = defaultPermissions;
        await this.collectionRepository.updateById(collection.id, collection);
      }
    }

    return true;
  }
}

import { User } from 'src/users/model/users.model';
import {
  DuplicateFormCommand,
  DuplicateProjectCommand,
} from '../impl/duplicate-collection.command';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { CollectionRepository } from 'src/collection/collection.repository';
import { InternalServerErrorException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CollectionCreatedEvent } from 'src/collection/events';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { Folder } from 'src/circle/types';

@CommandHandler(DuplicateFormCommand)
export class DuplicateFormCommandHandler
  implements ICommandHandler<DuplicateFormCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext('DuplicateFormCommandHandler');
  }

  async execute(command: DuplicateFormCommand) {
    const { caller, collectionSlug, destinationCircleId } = command;
    try {
      const collection = await this.collectionRepository.findOne({
        slug: collectionSlug,
      });
      if (!collection) throw 'Collection does not exist';
      const currParentCircleId = collection.parents[0];
      const currParentCircle = await this.queryBus.execute(
        new GetCircleByIdQuery(currParentCircleId),
      );
      let newParentCircleId = currParentCircleId;
      let newParentCircle = currParentCircle;
      if (destinationCircleId) {
        newParentCircleId = destinationCircleId;
        newParentCircle = await this.queryBus.execute(
          new GetCircleByIdQuery(newParentCircleId),
        );
      }
      // Remove incentives to prevent security issues if its not the creator
      let updatesIfNotCreator = {};
      if (collection.creator !== caller.id) {
        updatesIfNotCreator = {
          mintkudosTokenId: undefined,
          numOfKudos: undefined,
          surveyTokenId: undefined,
          surveyChain: undefined,
          surveyTotalValue: undefined,
          poapEventId: undefined,
          poapEditCode: undefined,
          minimumNumberOfAnswersThatNeedToMatchForPoap: undefined,
          responseDataForPoap: undefined,
          minimumNumberOfAnswersThatNeedToMatchForMintkudos: undefined,
          responseDataForMintkudos: undefined,
          zealyXP: undefined,
          zealyXpPerField: undefined,
          responseDataForZealy: undefined,
        };
      }

      const collectionId = collection.id;
      delete collection._id;
      delete collection.id;
      const createdCollection = await this.collectionRepository.create({
        ...collection,
        name:
          newParentCircleId !== currParentCircleId
            ? `${collection.name}`
            : `${collection.name} (Copy)`,
        slug: uuidv4(),
        parents: collection.parents,
        permissions: collection.permissions,
        formMetadata: {
          ...collection.formMetadata,
          ...updatesIfNotCreator,
          active: true,
          surveyLotteryWinner: undefined,
          mintkudosClaimedBy: undefined,
          transactionHashes: {},
          drafts: {},
          skippedFormFields: {},
          idLookup: {},
          verificationTokens: {},
          zealyClaimedBy: undefined,
          pageVisitMetricsForUniqueUser: {},
          pageVisitMetricsForAllUser: {},
          pageVisitMetricsByUser: {},
          totalTimeSpentMetricsOnPage: {},
          totalTimeSpentMetricsOnPageForCompletedResponses: {},
          draftNextField: {},
          surveyVRFRequestId: undefined,
        },
        data: {},
        dataActivities: {},
        dataActivityOrder: {},
        dataOwner: {},
        creator: caller.id,
        archived: false,
        collectionLevelDiscordThreadRef: {} as any,
        subscriptions: {},
      });

      const currentCollectionIdFolder = Object.values(
        newParentCircle.folderDetails,
      ).find((f: Folder) => f.contentIds.includes(collectionId)) as Folder;

      const folderIdOfCurrentCollectionInParentCircle =
        currentCollectionIdFolder.id;
      const indexOfCurrentCollection =
        currentCollectionIdFolder.contentIds.indexOf(collectionId);

      await this.commandBus.execute(
        new UpdateCircleCommand(
          newParentCircleId,
          {
            collections: [
              ...(newParentCircle.collections || []),
              createdCollection.id,
            ],
            folderDetails: {
              ...newParentCircle.folderDetails,
              [folderIdOfCurrentCollectionInParentCircle]: {
                ...currentCollectionIdFolder,
                contentIds: [
                  ...currentCollectionIdFolder.contentIds.slice(
                    0,
                    indexOfCurrentCollection + 1,
                  ),
                  createdCollection.id,
                  ...currentCollectionIdFolder.contentIds.slice(
                    indexOfCurrentCollection + 1,
                  ),
                ],
              },
            },
          },
          caller.id,
        ),
      );

      this.eventBus.publish(
        new CollectionCreatedEvent(createdCollection, caller.id),
      );

      return createdCollection;
    } catch (err) {
      this.logger.error(
        `Failed duplication form with slug ${collectionSlug} with error ${err}`,
      );
      throw new InternalServerErrorException(`${err?.message || err}`);
    }
  }
}

@CommandHandler(DuplicateProjectCommand)
export class DuplicateProjectCommandHandler
  implements ICommandHandler<DuplicateProjectCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext('DuplicateProjectCommandHandler');
  }

  async execute(command: DuplicateProjectCommand) {
    const { caller, collectionSlug, destinationCircleId } = command;
    try {
      const collection = await this.collectionRepository.findOne({
        slug: collectionSlug,
      });
      if (!collection) throw 'Collection does not exist';
      const currParentCircleId = collection.parents[0];
      const currParentCircle = await this.queryBus.execute(
        new GetCircleByIdQuery(currParentCircleId),
      );
      let newParentCircleId = currParentCircleId;
      let newParentCircle = currParentCircle;
      if (destinationCircleId) {
        newParentCircleId = destinationCircleId;
        newParentCircle = await this.queryBus.execute(
          new GetCircleByIdQuery(newParentCircleId),
        );
      }

      const collectionId = collection.id;
      delete collection._id;
      delete collection.id;
      const createdCollection = await this.collectionRepository.create({
        ...collection,
        name:
          newParentCircleId !== currParentCircleId
            ? `${collection.name}`
            : `${collection.name} (Copy)`,
        slug: uuidv4(),
        parents: collection.parents,
        permissions: collection.permissions,
        creator: caller.id,
        archived: false,
        collectionLevelDiscordThreadRef: {} as any,
        subscriptions: {},
      });

      const currentCollectionIdFolder = Object.values(
        newParentCircle.folderDetails,
      ).find((f: Folder) => f.contentIds.includes(collectionId)) as Folder;

      const folderIdOfCurrentCollectionInParentCircle =
        currentCollectionIdFolder.id;
      const indexOfCurrentCollection =
        currentCollectionIdFolder.contentIds.indexOf(collectionId);

      await this.commandBus.execute(
        new UpdateCircleCommand(
          newParentCircleId,
          {
            collections: [
              ...(newParentCircle.collections || []),
              createdCollection.id,
            ],
            folderDetails: {
              ...newParentCircle.folderDetails,
              [folderIdOfCurrentCollectionInParentCircle]: {
                ...currentCollectionIdFolder,
                contentIds: [
                  ...currentCollectionIdFolder.contentIds.slice(
                    0,
                    indexOfCurrentCollection + 1,
                  ),
                  createdCollection.id,
                  ...currentCollectionIdFolder.contentIds.slice(
                    indexOfCurrentCollection + 1,
                  ),
                ],
              },
            },
          },
          caller.id,
        ),
      );

      this.eventBus.publish(
        new CollectionCreatedEvent(createdCollection, caller.id),
      );

      return createdCollection;
    } catch (err) {
      this.logger.error(
        `Failed duplication form with slug ${collectionSlug} with error ${err}`,
      );
      throw new InternalServerErrorException(`${err?.message || err}`);
    }
  }
}

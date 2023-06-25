import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Permissions } from 'src/collection/types/types';
import { LoggingService } from 'src/logging/logging.service';
import { MoveCollectionCommand } from '../impl/move-collection.command';
import { Folder } from 'src/circle/types';
import { CircleAuthGuard } from 'src/auth/circle.guard';
import { Collection } from 'src/collection/model/collection.model';

@CommandHandler(MoveCollectionCommand)
export class MoveCollectionCommandHandler
  implements ICommandHandler<MoveCollectionCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly circleAuthGuard: CircleAuthGuard,
  ) {
    this.logger.setContext('MoveCollectionCommandHandler');
  }

  removeCollectionFieldsThatRequireCircleLevelInfo(collection: Collection) {
    delete collection.formMetadata?.paymentConfig;
    delete collection.formMetadata?.zealyXP;
    delete collection.formMetadata?.zealyXpPerField;
    delete collection.formMetadata?.responseDataForZealy;
    delete collection.formMetadata?.formRoleGating;
    delete collection.formMetadata?.discordRoleGating;
  }

  async execute(command: MoveCollectionCommand) {
    const { caller, collectionSlug, circleId, folderId } = command;
    try {
      const collection = await this.collectionRepository.findOne({
        slug: collectionSlug,
      });
      if (!collection) throw 'Collection does not exist';
      const newParentCircleId = circleId;
      const currParentCircleId = collection.parents[0];
      if (currParentCircleId === newParentCircleId) {
        throw 'Collection is already in this space';
      }
      const newParentCircle = await this.queryBus.execute(
        new GetCircleByIdQuery(newParentCircleId),
      );
      if (
        !this.circleAuthGuard.checkPermissions(
          ['createNewForm'],
          newParentCircle.memberRoles?.[caller.id] || [],
          newParentCircle,
        )
      )
        throw new UnauthorizedException(
          `You do not have permission to move this ${
            collection.collectionType === 0 ? 'form' : 'project'
          } to this circle`,
        );
      const currParentCircle = await this.queryBus.execute(
        new GetCircleByIdQuery(currParentCircleId),
      );

      const defaultPermissions: Permissions = {
        manageSettings: [],
        updateResponsesManually: [],
        viewResponses: [],
        addComments: [],
      };
      Object.keys(newParentCircle.roles).map((role) => {
        if (newParentCircle.roles[role].permissions.createNewForm) {
          defaultPermissions.manageSettings.push(role);
          defaultPermissions.updateResponsesManually.push(role);
          defaultPermissions.viewResponses.push(role);
          defaultPermissions.addComments.push(role);
        }
      });

      this.removeCollectionFieldsThatRequireCircleLevelInfo(collection);
      // Add to new circle
      const movedCollection = await this.collectionRepository.updateById(
        collection.id,
        {
          ...collection,
          parents: [circleId],
          permissions: defaultPermissions,
        },
      );

      let newFolderId = folderId;
      if (!folderId)
        newFolderId = Object.keys(newParentCircle.folderDetails)?.[0];
      await this.commandBus.execute(
        new UpdateCircleCommand(
          newParentCircleId,
          {
            collections: [
              ...(newParentCircle.collections || []),
              movedCollection.id,
            ],
            folderDetails: {
              ...newParentCircle.folderDetails,
              [newFolderId]: {
                ...newParentCircle.folderDetails[newFolderId],
                contentIds: [
                  ...(newParentCircle.folderDetails[newFolderId].contentIds ||
                    []),
                  movedCollection.id,
                ],
              },
            },
          },
          caller.id,
        ),
      );

      // Remove from current circle
      const currentCollectionIdFolder = Object.values(
        currParentCircle.folderDetails,
      ).find((f: Folder) =>
        f.contentIds.includes(movedCollection.id),
      ) as Folder;

      const folderIdOfCurrentCollectionInParentCircle =
        currentCollectionIdFolder.id;

      await this.commandBus.execute(
        new UpdateCircleCommand(
          currParentCircleId,
          {
            collections: currParentCircle.collections.filter(
              (collectionId) => collectionId !== movedCollection.id,
            ),
            folderDetails: {
              ...currParentCircle.folderDetails,
              [folderIdOfCurrentCollectionInParentCircle]: {
                ...currParentCircle.folderDetails[
                  folderIdOfCurrentCollectionInParentCircle
                ],
                contentIds: currParentCircle.folderDetails[
                  folderIdOfCurrentCollectionInParentCircle
                ].contentIds.filter(
                  (contentId) => contentId !== movedCollection.id,
                ),
              },
            },
          },
          caller.id,
        ),
      );
      return movedCollection;
    } catch (err) {
      this.logger.error(
        `Failed moving form with slug ${collectionSlug} with error ${err}`,
      );
      throw err;
    }
  }
}

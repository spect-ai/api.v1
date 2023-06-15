import { InternalServerErrorException } from '@nestjs/common';
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
  ) {
    this.logger.setContext('MoveCollectionCommandHandler');
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

      // Add to new circle
      const movedCollection = await this.collectionRepository.updateById(
        collection.id,
        {
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
      ).find((f: Folder) => f.contentIds.includes(collection.id)) as Folder;

      const folderIdOfCurrentCollectionInParentCircle =
        currentCollectionIdFolder.id;

      await this.commandBus.execute(
        new UpdateCircleCommand(
          currParentCircleId,
          {
            collections: currParentCircle.collections.filter(
              (collectionId) => collectionId !== collection.id,
            ),
            folderDetails: {
              ...currParentCircle.folderDetails,
              [folderIdOfCurrentCollectionInParentCircle]: {
                ...currParentCircle.folderDetails[
                  folderIdOfCurrentCollectionInParentCircle
                ],
                contentIds: currParentCircle.folderDetails[
                  folderIdOfCurrentCollectionInParentCircle
                ].contentIds.filter((contentId) => contentId !== collection.id),
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
      throw new InternalServerErrorException(`${err?.message || err}`);
    }
  }
}

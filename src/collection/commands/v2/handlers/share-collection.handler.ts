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
import { ShareCollectionCommand } from '../impl/share-collection.command';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import { StrongerCollectionAuthGuard } from 'src/auth/collection.guard';
import { CommonTools } from 'src/common/common.service';

@CommandHandler(ShareCollectionCommand)
export class ShareCollectionCommandHandler
  implements ICommandHandler<ShareCollectionCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
    private readonly collectionGuard: StrongerCollectionAuthGuard,
    private readonly commonTools: CommonTools,
  ) {
    this.logger.setContext('ShareCollectionCommandHandler');
  }

  async execute(command: ShareCollectionCommand): Promise<string> {
    const { caller, collectionSlug } = command;
    try {
      const collection = await this.collectionRepository.findOne({
        slug: collectionSlug,
      });
      if (!collection) throw 'Collection does not exist';
      const shareSlugs = collection.shareSlugs;
      if (shareSlugs && shareSlugs.readonly) {
        return collection.shareSlugs.readonly;
      }
      if (
        !this.collectionGuard.checkPermissions(
          ['manageSettings'],
          caller.id,
          collection,
        )
      )
        throw new UnauthorizedException(
          'You do not have permission to share this collection',
        );
      const collectionCount = await this.collectionRepository.count();
      const newShareSlug = `${this.commonTools.generateUniqueValue()}${collectionCount}`;
      await this.collectionRepository.updateById(collection.id, {
        $set: {
          shareSlugs: {
            readonly: newShareSlug,
          },
        },
      });

      return newShareSlug;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}

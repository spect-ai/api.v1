import { ModifyDataStatusCommand } from '../impl/modify-data-status.command';
import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(ModifyDataStatusCommand)
export class ModifyDataStatusCommandHandler
  implements ICommandHandler<ModifyDataStatusCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('ModifyDataStatusCommandHandler');
  }

  async execute(command: ModifyDataStatusCommand) {
    const { collectionId, caller, dataSlug, active } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';

      if (collection?.dataStatus?.[dataSlug] === active) {
        throw 'Card is already ' + (active ? 'open' : 'closed');
      }

      const activityId = uuidv4();
      const content = `Card status set to ${active ? 'open' : 'closed'}`;
      const ref = {
        actor: {
          id: caller,
          type: 'user',
        },
      };

      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          dataStatus: {
            ...(collection.dataStatus || {}),
            [dataSlug]: active,
          },
          dataActivities: {
            ...(collection.dataActivities || {}),
            [dataSlug]: {
              ...((collection.dataActivities || {})?.[dataSlug] || {}),
              [activityId]: {
                content,
                ref,
                timestamp: new Date(),
                comment: false,
              },
            },
          },
          dataActivityOrder: {
            ...(collection.dataActivityOrder || {}),
            [dataSlug]: [
              ...collection.dataActivityOrder?.[dataSlug],
              activityId,
            ],
          },
        },
      );

      return await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(null, updatedCollection),
      );
    } catch (error) {}
  }
}

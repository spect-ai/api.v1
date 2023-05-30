import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Subscription } from 'src/collection/model/collection.model';
import { LoggingService } from 'src/logging/logging.service';
import { v4 as uuidv4 } from 'uuid';
import { RemoveSubscriptionCommand } from '../impl/remove-subscription.command';

@CommandHandler(RemoveSubscriptionCommand)
export class RemoveSubscriptionCommandHandler
  implements ICommandHandler<RemoveSubscriptionCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('RemoveSubscriptionCommandHandler');
  }

  async execute(command: RemoveSubscriptionCommand): Promise<{
    [key: string]: {
      [eventName: string]: string;
    };
  }> {
    try {
      const { collectionSlug, eventName, subscribedUrl } = command;
      const collection = await this.collectionRepository.findOne({
        slug: collectionSlug,
      });
      if (!collection) throw `Collection with id ${collectionSlug} not found`;

      const subscriptions = {
        ...(collection.subscriptions || {}),
        [eventName]: [
          ...(collection.subscriptions?.[eventName] || []).filter(
            (subscription) => subscription.url !== subscribedUrl,
          ),
        ],
      };

      await this.collectionRepository.updateByFilter(
        {
          slug: collectionSlug,
        },
        {
          subscriptions,
        },
      );

      return {
        removed: {
          [eventName]: subscribedUrl,
        },
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}

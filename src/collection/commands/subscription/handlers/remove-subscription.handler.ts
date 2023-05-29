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
    [eventName: string]: Subscription[];
  }> {
    try {
      const { collectionId, eventName, subscriptionId } = command;
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw `Collection with id ${collectionId} not found`;

      const subscriptions = {
        ...(collection.subscriptions || {}),
        [eventName]: [
          ...(collection.subscriptions?.[eventName] || []).filter(
            (subscription) => subscription.id !== subscriptionId,
          ),
        ],
      };

      await this.collectionRepository.updateById(collectionId, {
        subscriptions,
      });

      return subscriptions;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}

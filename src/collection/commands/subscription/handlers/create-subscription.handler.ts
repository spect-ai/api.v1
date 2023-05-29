import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import { v4 as uuidv4 } from 'uuid';
import { Subscription } from 'src/collection/model/collection.model';
import {
  SendEventToSubscribersCommand,
  SubscribeToEventCommand,
} from '../impl/create-subscription.command';

@CommandHandler(SubscribeToEventCommand)
export class SubscribeToEventCommandHandler
  implements ICommandHandler<SubscribeToEventCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('SubscribeToEventCommandHandler');
  }

  async execute(command: SubscribeToEventCommand): Promise<{
    [eventName: string]: Subscription[];
  }> {
    try {
      const { collectionId, createSubscriptionDto } = command;
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw `Collection with id ${collectionId} not found`;

      const { eventName, url, method, headers, body, params, query } =
        createSubscriptionDto;
      const subscriptions = {
        ...(collection.subscriptions || {}),
        [eventName]: [
          ...(collection.subscriptions?.[eventName] || []),
          {
            id: uuidv4(),
            url,
            eventName,
            method,
            headers,
            body,
            params,
            query,
          },
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

@CommandHandler(SendEventToSubscribersCommand)
export class SendEventToSubscribersCommandHandler
  implements ICommandHandler<SendEventToSubscribersCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('SendEventToSubscribersCommandHandler');
  }

  async execute(command: SendEventToSubscribersCommand): Promise<void> {
    try {
      const { collectionId, eventName, data } = command;
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw `Collection with id ${collectionId} not found`;

      const subscriptions = collection.subscriptions || {};
      const subscription = subscriptions[eventName];
      if (!subscription) throw `No subscription for event ${eventName}`;
      for (const sub of subscription) {
        if (sub.url) {
          const options = {};
          if (sub.headers) options['headers'] = sub.headers;
          if (sub.body) options['body'] = sub.body;
          if (sub.params) options['params'] = sub.params;
          if (sub.query) options['query'] = sub.query;
          await fetch(sub.url, options);
        }
      }
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}

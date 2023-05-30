import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import { v4 as uuidv4 } from 'uuid';
import { Subscription } from 'src/collection/model/collection.model';
import {
  SendEventToSubscribersCommand,
  SubscribeToEventCommand,
} from '../impl/create-subscription.command';
import fetch from 'node-fetch';

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
      const { collectionSlug, createSubscriptionDto } = command;
      const collection = await this.collectionRepository.findOne({
        slug: collectionSlug,
      });
      if (!collection) throw `Collection with id ${collectionSlug} not found`;

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
      await this.collectionRepository.updateByFilter(
        {
          slug: collectionSlug,
        },
        {
          subscriptions,
        },
      );

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
          if (sub.body)
            options['body'] = {
              data,
              properties: collection.properties,
              name: collection.name,
              slug: collection.slug,
            };
          if (sub.params) options['params'] = sub.params;
          if (sub.query) options['query'] = sub.query;
          try {
            await fetch(sub.url, options);
          } catch (error) {
            this.logger.error(
              `Error sending event to ${sub.url}: ${error?.message || error}`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}

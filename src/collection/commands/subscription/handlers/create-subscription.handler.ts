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
import { CommonTools } from 'src/common/common.service';

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
    private readonly commonTools: CommonTools,
  ) {
    this.logger.setContext('SendEventToSubscribersCommandHandler');
  }

  getHumanFriendlyValue(value: any, property: any) {
    switch (property.type) {
      case 'shortText':
      case 'email':
      case 'ethAddress':
      case 'url':
      case 'number':
      case 'date':
      case 'slider':
        return value;
      case 'singleSelect':
      case 'user':
        return value?.label;
      case 'multiSelect':
      case 'user[]':
        return value?.map((v) => v.label).join(', ');
      case 'discord':
        return {
          id: value?.id,
          username: `${value?.username}#${value?.discriminator}`,
        };
      case 'telegram':
        return {
          id: value?.id,
          username: value?.username,
        };

      case 'github':
        return {
          id: value?.id,
          username: value?.login,
        };
      case 'longText':
        return this.commonTools.enrich(value);
      case 'reward':
        return `${value?.value} ${value?.token?.label} on ${value?.chain?.label}`;
      case 'readonly':
        return null;
      default:
        return value;
    }
  }

  async execute(command: SendEventToSubscribersCommand): Promise<void> {
    try {
      const { collectionId, eventName, data } = command;
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw `Collection with id ${collectionId} not found`;

      const subscriptions = collection.subscriptions || {};
      const subscription = subscriptions[eventName];
      if (!subscription) throw `No subscription for event ${eventName}`;
      const dataItems = {};
      for (const [key, value] of Object.entries(data)) {
        if (
          !collection.properties[key] ||
          !collection.properties[key].isPartOfFormView
        )
          continue;
        const humanFriendlyValue = this.getHumanFriendlyValue(
          value,
          collection.properties[key],
        );
        if (humanFriendlyValue)
          dataItems[collection.properties[key].name] = humanFriendlyValue;
      }
      if (Object.keys(dataItems).length === 0) return;
      const dataSlug = data['slug'];
      dataItems['Response Id'] = dataSlug;
      dataItems['Response Created At'] =
        collection.dataActivities?.[dataSlug]?.[
          collection.dataActivityOrder?.[dataSlug]?.[0]
        ]?.timestamp || '';
      for (const sub of subscription) {
        if (sub.url) {
          const options = {};
          options['body'] = JSON.stringify(dataItems);
          options['headers'] = {
            ...(sub.headers || {}),
            'Content-Type': 'application/json',
          };

          if (sub.params) options['params'] = sub.params;
          if (sub.query) options['query'] = sub.query;
          options['method'] = sub.method || 'POST';
          try {
            const res = await fetch(sub.url, options);
            console.log({ res });
          } catch (error) {
            console.log({ error });
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

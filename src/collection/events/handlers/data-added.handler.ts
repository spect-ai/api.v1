import {
  CommandBus,
  EventBus,
  EventsHandler,
  IEventHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import {
  SingleEmailNotificationEvent,
  SingleNotificationEvent,
} from 'src/users/events/impl';
import { DataAddedEvent } from '../impl/data-added.event';
import {
  AddItemsCommand as AddItemsToUserCommand,
  GetTokensOfMultipleTokenTypesOfUserQuery,
} from 'src/users/commands/impl';
import { PerformAutomationOnCollectionDataAddCommand } from 'src/automation/commands/impl';
import { UpdateMultipleCirclesCommand } from 'src/circle/commands/impl/update-circle.command';
import { SendEventToSubscribersCommand } from 'src/collection/commands/subscription/impl/create-subscription.command';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { CollectionRepository } from 'src/collection/collection.repository';

@EventsHandler(DataAddedEvent)
export class DataAddedEventHandler implements IEventHandler<DataAddedEvent> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
    private readonly realtime: RealtimeGateway,
    private readonly guildxyzService: GuildxyzService,
    private readonly collectionRepository: CollectionRepository,
  ) {
    this.logger.setContext('DataAddedEventHandler');
  }

  async handle(event: DataAddedEvent) {
    try {
      console.log('DataAddedEventHandler');
      const { caller, collection, data } = event;
      const circle = (await this.queryBus.execute(
        new GetCircleByIdQuery(collection.parents[0]),
      )) as Circle;

      const notifContent = `A new response was received on ${collection.name}`;
      const redirectUrl = `/${circle.slug}/r/${collection.slug}?cardSlug=${data['slug']}`;

      if (
        collection.circleRolesToNotifyUponNewResponse &&
        collection.circleRolesToNotifyUponNewResponse.length > 0
      ) {
        const roleSet = new Set(collection.circleRolesToNotifyUponNewResponse);
        // console.log({ roleSet });
        for (const [memberId, roles] of Object.entries(circle.memberRoles)) {
          const hasRole = roles.some((role) => roleSet.has(role));
          if (hasRole && !collection.creator) {
            this.eventBus.publish(
              new SingleNotificationEvent(
                notifContent,
                collection.formMetadata?.logo || circle.avatar,
                redirectUrl,
                new Date(),
                [memberId],
              ),
            );
          }
        }
      }

      if (collection.collectionType === 0) {
        this.eventBus.publish(
          new SingleNotificationEvent(
            notifContent,
            collection.formMetadata?.logo || circle.avatar,
            redirectUrl,
            new Date(),
            [collection.creator],
          ),
        );
      }

      try {
        const res = await this.commandBus.execute(
          new PerformAutomationOnCollectionDataAddCommand(
            collection,
            data,
            data['slug'],
            caller.id,
            circle,
          ),
        );
        if (Object.keys(res.circle).length > 0) {
          await this.commandBus.execute(
            new UpdateMultipleCirclesCommand(res.circle),
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to perform automation on collection data add with error: ${error.message}`,
        );
      }

      if (collection.collectionType === 0) {
        const notifResponderContent = `Your response on ${collection.name} was received.`;
        // const responderSubject = `Response received!`;
        const responderRedirectUrl = `/r/${collection.slug}`;
        this.eventBus.publish(
          new SingleNotificationEvent(
            notifResponderContent,
            collection.formMetadata?.logo || circle.avatar,
            responderRedirectUrl,
            new Date(),
            [caller.id],
          ),
        );
      }

      this.logger.log(
        `Created New Data in collection ${event.collection?.name}`,
      );
      const updatedCollection = await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(collection.slug),
      );

      this.commandBus.execute(
        new AddItemsToUserCommand(
          [
            {
              fieldName: 'collectionsSubmittedTo',
              itemIds: [collection.slug],
            },
          ],
          null,
          caller.id,
        ),
      );

      this.commandBus.execute(
        new SendEventToSubscribersCommand(collection.id, 'dataAdded', data),
      );

      try {
        const rolesToNotify = collection.circleRolesToNotifyUponNewResponse;
        const membersToNotify = Object.entries(circle.memberRoles)
          .filter(([memberId, roles]) =>
            roles.some((role) => rolesToNotify.includes(role)),
          )
          .map(([memberId]) => memberId);

        console.log({ rolesToNotify, membersToNotify });
        const uniqueMembersToNotify = [...new Set(membersToNotify)];
        console.log({ uniqueMembersToNotify });
        this.eventBus.publish(
          new SingleEmailNotificationEvent(
            `A new response was received on ${collection.name}`,
            `New response on ${collection.name}`,
            `http://localhost:3000${redirectUrl}`,
            uniqueMembersToNotify,
          ),
        );
      } catch (error) {
        this.logger.error(
          `Failed sending email notification to user with error: ${error.message}`,
        );
      }

      try {
        const filteredData = { ...data };
        if (collection.formMetadata?.lookup?.tokens?.length) {
          const res = await this.queryBus.execute(
            new GetTokensOfMultipleTokenTypesOfUserQuery(
              caller,
              collection.formMetadata.lookup.tokens,
            ),
          );
          filteredData['__lookup__'] = res;
        }
        if (collection.formMetadata?.lookup?.communities) {
          const communitiesOfUser =
            await this.guildxyzService.getDetailedGuildMembershipsWithRoles(
              caller.ethAddress,
            );
          filteredData['__lookupCommunities__'] = communitiesOfUser;
        }
        if (
          filteredData['__lookup__'] ||
          filteredData['__lookupCommunities__']
        ) {
          await this.collectionRepository.updateById(collection.id, {
            data: {
              ...collection.data,
              [data['slug']]: filteredData,
            },
          });
        }
      } catch (error) {
        this.logger.error(
          `Failed adding lookup data to user with error: ${error.message}`,
        );
      }

      // console.log('event', `${collection.slug}:dataAdded`);
      this.realtime.server.emit(
        `${collection.slug}:dataAdded`,
        updatedCollection,
      );
    } catch (error) {
      this.logger.error(`${error.message}`);
    }
  }
}

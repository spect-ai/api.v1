import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateDiscordThreadCommand } from 'src/automation/commands/impl';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { DiscordService } from 'src/common/discord.service';
import { LoggingService } from 'src/logging/logging.service';
import { LookupRepository } from 'src/lookup/lookup.repository';
import { User } from 'src/users/model/users.model';
import { CollectionRepository } from '../collection.repository';
import { UpdateCollectionCommand } from '../commands';
import {
  LinkDiscordDto,
  LinkDiscordToCollectionDto,
  LinkDiscordThreadToDataDto,
} from '../dto/link-discord.dto';
import {
  GetCollectionByFilterQuery,
  GetCollectionByIdQuery,
  GetPrivateViewCollectionQuery,
} from '../queries';

@Injectable()
export class LinkDiscordService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
    private readonly discordService: DiscordService,
    private readonly lookupRepository: LookupRepository,
    private readonly collectionRepository: CollectionRepository,
  ) {
    this.logger.setContext('LinkDiscordService');
  }

  async createAndlinkThread(
    collectionId: string,
    dataId: string,
    linkDiscordDto: LinkDiscordDto,
    caller: User,
  ) {
    try {
      const collection = await this.queryBus.execute(
        new GetCollectionByIdQuery(collectionId),
      );
      if (!collection) {
        throw new NotFoundException('Collection not found');
      }

      const res = await this.commandBus.execute(
        new CreateDiscordThreadCommand(
          {
            id: '',
            type: 'createDiscordThread',
            name: 'Create Discord Thread',
            service: 'discord',
            data: {
              circleId: collection.parents[0],
              threadNameType: 'value',
              ...linkDiscordDto,
              threadName: {
                value: linkDiscordDto.threadName,
              },
            },
          },
          caller.id,
          {},
          {},
          {
            dataSlug: dataId,
            collectionSlug: collection.slug,
          },
        ),
      );
      return await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(collection.slug, null),
      );
    } catch (e) {
      console.log(e);
      this.logger.logError(`Failed linking discord with error ${e}`);
    }
  }

  async linkThreadToCollection(
    collectionId: string,
    linkDiscordDto: LinkDiscordToCollectionDto,
    caller: User,
  ) {
    const { threadName, selectedChannel } = linkDiscordDto;
    try {
      const collection = await this.queryBus.execute(
        new GetCollectionByIdQuery(collectionId),
      );
      if (!collection) {
        throw new NotFoundException('Collection not found');
      }
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(collection.parents[0]),
      );

      const threadId = await this.discordService.createThread(
        circle.discordGuildId,
        threadName,
        selectedChannel.value,
        false,
        [],
        [],
        collection.description || "Let's get started!",
        true,
      );
      await this.commandBus.execute(
        new UpdateCollectionCommand(
          {
            collectionLevelDiscordThreadRef: {
              threadId: threadId,
              channelId: selectedChannel.value,
              guildId: circle.discordGuildId,
              private: false,
            },
          },
          caller.id,
          collection._id.toString(),
        ),
      );
      return await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(collection.slug, null),
      );
    } catch (e) {
      console.log(e);
      this.logger.logError(`Failed linking discord with error ${e}`);
    }
  }

  async linkThreadToData(
    messageId: string,
    discordUserId: string,
    linkThreadToDataDto: LinkDiscordThreadToDataDto,
  ) {
    try {
      const collection = await this.queryBus.execute(
        new GetCollectionByFilterQuery({
          'collectionLevelDiscordThreadRef.messageId': messageId,
        }),
      );
      if (!collection) {
        throw new NotFoundException('Collection not found');
      }

      await this.collectionRepository.updateById(collection.id, {
        discordThreadRef: {
          ...(collection.discordThreadRef || {}),
          [discordUserId]: linkThreadToDataDto,
        },
      });

      await this.lookupRepository.create({
        key: linkThreadToDataDto.threadId,
        keyType: 'discordThreadId',
        collectionId: collection.id,
      });
      return true;
    } catch (e) {
      console.log(e);
      this.logger.logError(`Failed linking discord with error ${e}`);
    }
  }

  async postForm(collectionId: string, channelId: string, caller: User) {
    try {
      const collection = await this.queryBus.execute(
        new GetCollectionByIdQuery(collectionId),
      );
      if (!collection) {
        throw new NotFoundException('Collection not found');
      }
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(collection.parents[0]),
      );

      const res = await this.discordService.postForm(
        channelId,
        collection.name,
        collection.description,
      );
      console.log({ res });
      await this.commandBus.execute(
        new UpdateCollectionCommand(
          {
            collectionLevelDiscordThreadRef: {
              messageId: res.messageId,
              channelId,
              guildId: circle.discordGuildId,
              private: false,
            },
          },
          caller.id,
          collection._id.toString(),
        ),
      );
      return await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(collection.slug, null),
      );
    } catch (e) {
      console.log(e);
      this.logger.logError(`Failed posting form with error ${e}`);
      throw e;
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateDiscordThreadCommand } from 'src/automation/commands/impl';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { DiscordService } from 'src/common/discord.service';
import { LoggingService } from 'src/logging/logging.service';
import { User } from 'src/users/model/users.model';
import { UpdateCollectionCommand } from '../commands';
import {
  LinkDiscordDto,
  LinkDiscordToCollectionDto,
} from '../dto/link-discord.dto';
import {
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
  ) {
    this.logger.setContext('LinkDiscordService');
  }

  async linkThread(
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
}

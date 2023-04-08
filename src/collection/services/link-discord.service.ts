import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateDiscordThreadCommand } from 'src/automation/commands/impl';
import { LoggingService } from 'src/logging/logging.service';
import { User } from 'src/users/model/users.model';
import { LinkDiscordDto } from '../dto/link-discord.dto';
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
        new GetPrivateViewCollectionQuery(collection.slug),
      );
    } catch (e) {
      console.log(e);
      this.logger.logError(`Failed linking discord with error ${e}`);
    }
  }
}

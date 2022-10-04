import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import { AddDataCommand } from '../impl/add-data.command';
import { v4 as uuidv4 } from 'uuid';
import { UpdateDataCommand } from '../impl/update-data.command';
import { RemoveDataCommand } from '../impl/remove-data.command';

@CommandHandler(RemoveDataCommand)
export class RemoveDataCommandHandler
  implements ICommandHandler<RemoveDataCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('RemoveDataCommandHandler');
  }

  async execute(command: RemoveDataCommand) {
    const { caller, collectionId, dataSlug } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      delete collection.data[dataSlug];
      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          data: collection.data,
        },
      );
      return updatedCollection;
    } catch (err) {
      this.logger.error(
        `Failed removing data from collection Id ${collectionId} with error ${err.message}`,
      );
      throw new InternalServerErrorException(
        `Failed removing data from collection Id ${collectionId} with error ${err.message}`,
      );
    }
  }
}

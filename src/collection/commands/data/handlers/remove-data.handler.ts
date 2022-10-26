import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import {
  RemoveDataCommand,
  RemoveMultipleDataCommand,
} from '../impl/remove-data.command';

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
      if (collection.dataOwner[dataSlug] !== caller?.id)
        throw 'You are not the owner of this data';
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

@CommandHandler(RemoveMultipleDataCommand)
export class RemoveMultipleDataCommandHandler
  implements ICommandHandler<RemoveMultipleDataCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('RemoveDataCommandHandler');
  }

  async execute(command: RemoveMultipleDataCommand) {
    const { collectionId, dataIds, caller } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      for (const dataId of dataIds) {
        if (collection.dataOwner[dataId] !== caller?.id)
          throw 'You are not the owner of this data';

        delete collection.data[dataId];
      }

      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          data: collection.data,
        },
      );
      return updatedCollection;
    } catch (err) {
      this.logger.error(
        `Failed removing multiple data from collection Id ${collectionId} with error ${err.message}`,
      );
      throw new InternalServerErrorException(
        `Failed removing multiple data from collection Id ${collectionId} with error ${err.message}`,
      );
    }
  }
}

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

@CommandHandler(AddDataCommand)
export class AddDataCommandHandler implements ICommandHandler<AddDataCommand> {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AddDataCommandHandler');
  }

  async execute(command: AddDataCommand) {
    const { addDataDto, caller, collectionId } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      for (const [propertyId, property] of Object.entries(
        collection.properties,
      )) {
        if (property.default && !addDataDto[propertyId]) {
          addDataDto[propertyId] = property.default;
        }
      }
      addDataDto['slug'] = uuidv4();
      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          data: {
            ...collection.data,
            [addDataDto['slug']]: addDataDto,
          },
        },
      );
      return updatedCollection;
    } catch (err) {
      this.logger.error(
        `Failed adding collection to collection Id ${collectionId} with error ${err.message}`,
      );
      throw new InternalServerErrorException(
        `Failed adding collection to collection Id ${collectionId} with error ${err.message}`,
      );
    }
  }
}

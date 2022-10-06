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
import { DataValidationService } from 'src/collection/validations/data-validation.service';

@CommandHandler(AddDataCommand)
export class AddDataCommandHandler implements ICommandHandler<AddDataCommand> {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
    private readonly validationService: DataValidationService,
  ) {
    this.logger.setContext('AddDataCommandHandler');
  }

  async execute(command: AddDataCommand) {
    const { data, caller, collectionId } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      const validData = await this.validationService.validate(data, collection);
      if (!validData) {
        throw new Error(`Data invalid`);
      }
      for (const [propertyId, property] of Object.entries(
        collection.properties,
      )) {
        if (property.default && !data[propertyId]) {
          data[propertyId] = property.default;
        }
      }
      data['slug'] = uuidv4();
      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          data: {
            ...collection.data,
            [data['slug']]: data,
          },
        },
      );
      return updatedCollection;
    } catch (err) {
      this.logger.error(
        `Failed adding collection to collection Id ${collectionId} with error ${err}`,
      );
      throw new InternalServerErrorException(
        `Failed adding collection to collection Id ${collectionId} with error ${err}`,
      );
    }
  }
}

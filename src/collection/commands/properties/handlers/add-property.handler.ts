import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { LoggingService } from 'src/logging/logging.service';
import { AddPropertyCommand } from '../impl/add-property.command';

@CommandHandler(AddPropertyCommand)
export class AddPropertyCommandHandler
  implements ICommandHandler<AddPropertyCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AddPropertyCommandHandler');
  }

  async execute(command: AddPropertyCommand): Promise<Collection> {
    try {
      console.log('AddPropertyCommandHandler');
      const { addPropertyCommandDto, caller, collectionId } = command;
      const collection = await this.collectionRepository.findById(collectionId);
      console.log(addPropertyCommandDto);
      if (
        collection.properties &&
        collection.properties[addPropertyCommandDto.name]
      )
        throw 'Cannot add property with duplicate name';

      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          properties: {
            ...collection.properties,
            [addPropertyCommandDto.name]: {
              ...addPropertyCommandDto,
              isPartOfFormView: addPropertyCommandDto.isPartOfFormView || true,
            },
          },
          propertyOrder: [
            ...(collection.propertyOrder || []),
            addPropertyCommandDto.name,
          ],
        },
      );
      return updatedCollection;
    } catch (error) {
      this.logger.error(
        `Failed adding property to collection with error: ${error}`,
        command,
      );
      throw new InternalServerErrorException(
        'Failed adding property to collection with error: ${error}',
        error.message,
      );
    }
  }
}

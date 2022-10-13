import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { LoggingService } from 'src/logging/logging.service';
import { UpdatePropertyCommand } from '../impl/update-property.command';

@CommandHandler(UpdatePropertyCommand)
export class UpdatePropertyCommandHandler
  implements ICommandHandler<UpdatePropertyCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UpdatePropertyCommandHandler');
  }

  async execute(command: UpdatePropertyCommand): Promise<Collection> {
    try {
      console.log('UpdatePropertyCommandHandler');
      const { updatePropertyCommandDto, caller, collectionId, propertyId } =
        command;
      const collection = await this.collectionRepository.findById(collectionId);

      if (!collection.properties || !collection.properties[propertyId])
        throw `Cannot find property with id ${propertyId}`;

      const propId = updatePropertyCommandDto.name
        ? updatePropertyCommandDto.name
        : propertyId;
      if (
        updatePropertyCommandDto.name &&
        updatePropertyCommandDto.name !== propertyId
      ) {
        if (collection.properties[propertyId].immutable)
          throw 'Property is immutable and cannot be updated';
        if (collection.properties[updatePropertyCommandDto.name])
          throw `Property already existss`;
        if (collection.data)
          for (const [id, data] of Object.entries(collection.data)) {
            data[updatePropertyCommandDto.name] = data[propertyId];
            delete data[propertyId];
          }

        delete collection.properties[propertyId];
        const idx = collection.propertyOrder.indexOf(propertyId);
        collection.propertyOrder[idx] = updatePropertyCommandDto.name;
      }

      if (updatePropertyCommandDto.options) {
        const optionValueSet = new Set([
          ...updatePropertyCommandDto.options.map((a) => a.value),
        ]);
        if (collection.data)
          for (const [id, data] of Object.entries(collection.data)) {
            if (data[propertyId] && !optionValueSet.has(data[propertyId].value))
              delete data[propertyId];
          }
      }
      collection.properties[propId] = {
        ...collection.properties[propertyId],
        ...updatePropertyCommandDto,
      };
      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          properties: collection.properties,
          propertyOrder: collection.propertyOrder,
          data: collection.data,
        },
      );

      return updatedCollection;
    } catch (error) {
      this.logger.error(
        `Failed updating property to collection with error: ${error}`,
        command,
      );
      throw new InternalServerErrorException(
        'Failed updating property to collection with error: ${error}',
        error.message,
      );
    }
  }
}

import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { GetPrivateViewCollectionQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { AddPropertyCommand } from '../impl/add-property.command';
import { AddPropertyDto } from 'src/collection/dto/update-property-request.dto';

@CommandHandler(AddPropertyCommand)
export class AddPropertyCommandHandler
  implements ICommandHandler<AddPropertyCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext('AddPropertyCommandHandler');
  }

  async execute(command: AddPropertyCommand): Promise<Collection> {
    try {
      console.log('AddPropertyCommandHandler');
      const { addPropertyCommandDto, collectionId, pageId } = command;
      this.removeUnwantedKeys(addPropertyCommandDto);
      const collection = await this.collectionRepository.findById(collectionId);
      if (addPropertyCommandDto.type === 'cardRelation') {
        const parentRelationpProperty =
          addPropertyCommandDto.cardRelationOptions.parentRelation;
        const childRelationProperty =
          addPropertyCommandDto.cardRelationOptions.childRelation;
        if (
          collection.properties &&
          (collection.properties[parentRelationpProperty] ||
            collection.properties[childRelationProperty])
        )
          throw 'Cannot add property with duplicate name';
        const updatedCollection = await this.collectionRepository.updateById(
          collectionId,
          {
            properties: {
              ...collection.properties,
              [parentRelationpProperty]: {
                ...addPropertyCommandDto,
                name: parentRelationpProperty,
                isPartOfFormView:
                  addPropertyCommandDto.isPartOfFormView || true,
              },
              [childRelationProperty]: {
                ...addPropertyCommandDto,
                name: childRelationProperty,
                isPartOfFormView:
                  addPropertyCommandDto.isPartOfFormView || true,
              },
            },
            propertyOrder: [
              ...(collection.propertyOrder || []),
              parentRelationpProperty,
              childRelationProperty,
            ],
          },
        );
        return await this.queryBus.execute(
          new GetPrivateViewCollectionQuery(updatedCollection.slug),
        );
      }
      // if (
      //   collection.properties &&
      //   collection.properties[addPropertyCommandDto.name]
      // )
      //   throw 'Cannot add property with duplicate name';

      let updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          properties: {
            ...collection.properties,
            [addPropertyCommandDto.id]: {
              ...addPropertyCommandDto,
              isPartOfFormView: addPropertyCommandDto.isPartOfFormView || true,
            },
          },
          propertyOrder: [
            ...(collection.propertyOrder || []),
            addPropertyCommandDto.id,
          ],
        },
      );

      if (collection.collectionType === 0) {
        updatedCollection = await this.collectionRepository.updateById(
          collectionId,
          {
            formMetadata: {
              ...collection.formMetadata,
              pages: {
                ...collection.formMetadata.pages,
                [pageId]: {
                  ...collection.formMetadata.pages[pageId],
                  properties: [
                    ...(collection.formMetadata.pages[pageId].properties || []),
                    addPropertyCommandDto.id,
                  ],
                },
              },
            },
          },
        );
      }

      return await this.queryBus.execute(
        new GetPrivateViewCollectionQuery(updatedCollection.slug),
      );
    } catch (error) {
      this.logger.error(
        `Failed adding property to collection with error: ${error}`,
        command,
      );
      throw new InternalServerErrorException(
        `Failed adding property to collection with error: ${error}`,
        error.message,
      );
    }
  }

  removeUnwantedKeys(addPropertyCommandDto: AddPropertyDto) {
    switch (addPropertyCommandDto.type) {
      case 'slider':
        delete addPropertyCommandDto.options;
        delete addPropertyCommandDto.cardRelationOptions;
        delete addPropertyCommandDto.payWallOptions;
        delete addPropertyCommandDto.rewardOptions;
        delete addPropertyCommandDto.milestoneFields;
        delete addPropertyCommandDto.onUpdateNotifyUserTypes;
        delete addPropertyCommandDto.allowCustom;
        delete addPropertyCommandDto.maxSelections;
        break;
      case 'number':
        delete addPropertyCommandDto.options;
        delete addPropertyCommandDto.payWallOptions;
        delete addPropertyCommandDto.rewardOptions;
        delete addPropertyCommandDto.milestoneFields;
        delete addPropertyCommandDto.onUpdateNotifyUserTypes;
        delete addPropertyCommandDto.allowCustom;
        delete addPropertyCommandDto.maxSelections;
        delete addPropertyCommandDto.sliderOptions;
        break;
      default:
        break;
    }
  }
}

import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { LoggingService } from 'src/logging/logging.service';
import {
  AddDataCommand,
  AddDataUsingAutomationCommand,
} from '../impl/add-data.command';
import { v4 as uuidv4 } from 'uuid';
import { DataValidationService } from 'src/collection/validations/data-validation.service';
import { DataAddedEvent } from 'src/collection/events';
import { Collection } from 'src/collection/model/collection.model';
import { MappedItem } from 'src/common/interfaces';
import { Activity } from 'src/collection/types/types';
import { AdvancedAccessService } from 'src/collection/services/advanced-access.service';
import {
  GetPrivateViewCollectionQuery,
  GetPublicViewCollectionQuery,
} from 'src/collection/queries';
import {
  GetProfileQuery,
  GetUserByFilterQuery,
  GetUserByIdQuery,
  GetUserByUsernameQuery,
} from 'src/users/queries/impl';

@CommandHandler(AddDataCommand)
export class AddDataCommandHandler implements ICommandHandler<AddDataCommand> {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly validationService: DataValidationService,
    private readonly advancedAccessService: AdvancedAccessService,
  ) {
    this.logger.setContext('AddDataCommandHandler');
  }

  async execute(command: AddDataCommand) {
    const { data, caller, collectionId } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      if (collection.collectionType === 0) {
        if (collection.formMetadata.active === false)
          throw 'Collection is inactive';
        if (
          !collection.formMetadata.multipleResponsesAllowed &&
          collection.dataOwner &&
          Object.values(collection.dataOwner)?.includes(caller?.id)
        ) {
          throw 'User has already submitted a response';
        }
        const hasPassedSybilCheck =
          await this.advancedAccessService.hasPassedSybilProtection(
            collection,
            caller,
          );
        if (!hasPassedSybilCheck) throw 'User has not passed sybil check';
        const hasRole = await this.advancedAccessService.hasRoleToAccessForm(
          collection,
          caller,
        );
        if (!hasRole)
          throw 'User does not have access to add data this collection';
      }

      const validData = await this.validationService.validate(
        data,
        'add',
        false,
        collection,
      );
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

      /** Disabling activity for forms as it doesnt quite make sense yet */
      const { dataActivities, dataActivityOrder } = this.getActivity(
        collection,
        data,
        caller?.id,
      );

      const views = collection.projectMetadata.views;
      const viewsValues = Object.values(views);

      viewsValues.forEach((view) => {
        if (['kanban', 'list'].includes(view.type)) {
          const columnIndex = collection.properties[
            view.groupByColumn
          ].options.findIndex(
            (option) => option.value === data[view.groupByColumn].value,
          );
          if (columnIndex === -1) {
            throw new Error(
              `Column value ${data[view.groupByColumn].value} does not exist`,
            );
          }
          view.cardColumnOrder[columnIndex].push(data['slug']);
        }
      });

      Object.keys(views).forEach((viewId, index) => {
        views[viewId] = viewsValues[index];
      });

      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          data: {
            ...collection.data,
            [data['slug']]: data,
          },
          dataActivities,
          dataActivityOrder,
          dataOwner: {
            ...(collection.dataOwner || {}),
            [data['slug']]: caller?.id,
          },
          projectMetadata: {
            ...collection.projectMetadata,
            views,
          },
        },
      );
      this.eventBus.publish(new DataAddedEvent(collection, data, caller));
      if (collection.collectionType === 0) {
        return await this.queryBus.execute(
          new GetPublicViewCollectionQuery(
            caller,
            collection.slug,
            updatedCollection,
          ),
        );
      } else {
        return await this.queryBus.execute(
          new GetPrivateViewCollectionQuery(null, updatedCollection),
        );
      }
    } catch (err) {
      this.logger.error(
        `Failed adding collection to collection Id ${collectionId} with error ${err}`,
      );
      throw new InternalServerErrorException(
        `Failed adding collection to collection Id ${collectionId} with error ${err}`,
      );
    }
  }

  getActivity(
    collection: Collection,
    data: object,
    caller: string,
  ): {
    dataActivities: MappedItem<MappedItem<Activity>>;
    dataActivityOrder: MappedItem<string[]>;
  } {
    const activityId = uuidv4();
    let content, ref;
    const dataType =
      collection.defaultView === 'form'
        ? 'response'
        : collection.defaultView === 'table'
        ? 'row'
        : 'card';
    if (caller) {
      content = `created new ${dataType}`;
      ref = {
        actor: {
          id: caller,
          type: 'user',
        },
      };
    } else {
      content = `New ${dataType} was added`;
    }
    return {
      dataActivities: {
        ...(collection.dataActivities || {}),
        [data['slug']]: {
          [activityId]: {
            content,
            ref,
            timestamp: new Date(),
            comment: false,
          },
        },
      },
      dataActivityOrder: {
        ...(collection.dataActivityOrder || {}),
        [data['slug']]: [activityId],
      },
    };
  }
}

@CommandHandler(AddDataUsingAutomationCommand)
export class AddDataUsingAutomationCommandHandler
  implements ICommandHandler<AddDataUsingAutomationCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly validationService: DataValidationService,
    private readonly advancedAccessService: AdvancedAccessService,
  ) {
    this.logger.setContext('AddDataUsingAutomationCommandHandler');
  }

  async execute(command: AddDataUsingAutomationCommand) {
    const { data, collectionId } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      const botUser = await this.queryBus.execute(
        new GetProfileQuery(
          {
            username: 'Stu, the Spect Bot',
          },
          '',
        ),
      );
      const validData = await this.validationService.validate(
        data,
        'add',
        true,
        collection,
      );
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

      /** Disabling activity for forms as it doesnt quite make sense yet */
      const { dataActivities, dataActivityOrder } = this.getActivity(
        collection,
        data,
        botUser.id,
      );
      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          data: {
            ...collection.data,
            [data['slug']]: data,
          },
          dataActivities,
          dataActivityOrder,
          dataOwner: {
            ...(collection.dataOwner || {}),
            [data['slug']]: botUser.id,
          },
        },
      );
      // this.eventBus.publish(new DataAddedEvent(collection, data, botUser));
      return await this.queryBus.execute(
        new GetPublicViewCollectionQuery(
          botUser,
          collection.slug,
          updatedCollection,
        ),
      );
    } catch (err) {
      this.logger.error(
        `Failed adding collection to collection Id ${collectionId} with error ${err}`,
      );
      throw new InternalServerErrorException(
        `Failed adding collection to collection Id ${collectionId} with error ${err}`,
      );
    }
  }

  getActivity(
    collection: Collection,
    data: object,
    caller: string,
  ): {
    dataActivities: MappedItem<MappedItem<Activity>>;
    dataActivityOrder: MappedItem<string[]>;
  } {
    const activityId = uuidv4();
    let content, ref;
    const dataType =
      collection.defaultView === 'form'
        ? 'response'
        : collection.defaultView === 'table'
        ? 'row'
        : 'card';
    if (caller) {
      content = `created new ${dataType}`;
      ref = {
        actor: {
          id: caller,
          type: 'user',
        },
      };
    } else {
      content = `New ${dataType} was added`;
    }
    return {
      dataActivities: {
        ...(collection.dataActivities || {}),
        [data['slug']]: {
          [activityId]: {
            content,
            ref,
            timestamp: new Date(),
            comment: false,
          },
        },
      },
      dataActivityOrder: {
        ...(collection.dataActivityOrder || {}),
        [data['slug']]: [activityId],
      },
    };
  }
}

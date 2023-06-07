import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { HasSatisfiedAdvancedDataConditionsQuery } from 'src/automation/queries/impl';
import { CollectionRepository } from 'src/collection/collection.repository';
import { DataAddedEvent } from 'src/collection/events';
import { Collection } from 'src/collection/model/collection.model';
import {
  GetPrivateViewCollectionQuery,
  GetPublicViewCollectionQuery,
} from 'src/collection/queries';
import { AdvancedAccessService } from 'src/collection/services/advanced-access.service';
import { ResponseCredentialService } from 'src/collection/services/response-credentialing.service';
import { Activity } from 'src/collection/types/types';
import { DataValidationService } from 'src/collection/validations/data-validation.service';
import { MappedItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { GetProfileQuery } from 'src/users/queries/impl';
import { v4 as uuidv4 } from 'uuid';
import {
  AddDataCommand,
  AddDataUsingAutomationCommand,
  AddMultipleDataUsingAutomationCommand,
} from '../impl/add-data.command';

@Injectable()
export class ActivityOnAddData {
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

@CommandHandler(AddDataCommand)
export class AddDataCommandHandler implements ICommandHandler<AddDataCommand> {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly validationService: DataValidationService,
    private readonly advancedAccessService: AdvancedAccessService,
    private readonly activityOnAddData: ActivityOnAddData,
    private readonly responseCredentialService: ResponseCredentialService,
  ) {
    this.logger.setContext('AddDataCommandHandler');
  }

  async execute(command: AddDataCommand) {
    const {
      data,
      caller,
      collectionId,
      anon,
      validateAccess,
      validateData,
      discordId,
      verificationToken,
    } = command;
    try {
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection) throw 'Collection does not exist';
      let verificationUserUniqueId;

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

        if (validateAccess) {
          if (collection.formMetadata.discordRoleGating?.length) {
            if (!verificationToken && !discordId)
              throw 'No verification token or discord id provided';
            if (verificationToken)
              for (const [key, verifiToken] of Object.entries(
                collection.formMetadata.verificationTokens,
              )) {
                if (verifiToken === verificationToken) {
                  verificationUserUniqueId = key;
                  break;
                }
              }
          } else if (discordId) {
            await this.advancedAccessService.hasDiscordRoleToAccessForm(
              collection,
              discordId,
            );
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
          if (!hasPassedSybilCheck) throw 'User has not passed sybil check';

          if (!hasRole)
            throw 'User does not have access to add data this collection';
        }
      }

      let filteredData =
        await this.filterValuesWherePropertyDoesntSatisfyCondition(
          collection,
          data,
        );
      filteredData = await this.filterUndefinedValues(filteredData);

      if (validateData) {
        const validData = await this.validationService.validate(
          filteredData,
          'add',
          false,
          collection,
        );
        if (!validData) {
          throw new Error(`Data invalid`);
        }
      }
      for (const [propertyId, property] of Object.entries(
        collection.properties,
      )) {
        if (property.default && !filteredData[propertyId]) {
          filteredData[propertyId] = property.default;
        }
      }

      filteredData['slug'] = uuidv4();

      /** Disabling activity for forms as it doesnt quite make sense yet */
      const { dataActivities, dataActivityOrder } =
        this.activityOnAddData.getActivity(
          collection,
          filteredData,
          caller?.id,
        );
      const cardOrders = collection.projectMetadata?.cardOrders || {};
      if (Object.keys(cardOrders).length) {
        Object.keys(cardOrders).forEach((groupByColumn) => {
          const columnIndex = collection.properties[
            groupByColumn
          ].options.findIndex(
            (option) => option.value === data[groupByColumn]?.value,
          );
          try {
            cardOrders[groupByColumn][columnIndex + 1].push(
              filteredData['slug'],
            );
          } catch (e) {
            // initialising the empty columns if they dont exist till that last index
            for (
              let i = cardOrders[groupByColumn].length;
              i <= columnIndex + 1;
              i++
            ) {
              cardOrders[groupByColumn].push([]);
            }
            cardOrders[groupByColumn][columnIndex + 1].push(
              filteredData['slug'],
            );
          }
        });
      }

      let formMetadata = collection.formMetadata;
      if (discordId) {
        formMetadata = {
          ...formMetadata,
          drafts: {
            ...(formMetadata?.drafts || {}),
            [discordId]: {
              ...(formMetadata?.drafts?.[discordId] || {}),
              saved: true,
            },
          },
        };
      }
      if (verificationUserUniqueId) {
        formMetadata = {
          ...formMetadata,
          verificationTokens: {
            ...(formMetadata?.verificationTokens || {}),
            [verificationUserUniqueId]: null,
          },
        };
      }
      filteredData['anonymous'] = anon;
      const updatedCollection = await this.collectionRepository.updateById(
        collectionId,
        {
          data: {
            ...collection.data,
            [filteredData['slug']]: filteredData,
          },
          dataActivities,
          dataActivityOrder,
          dataOwner: {
            ...(collection.dataOwner || {}),
            [filteredData['slug']]: caller?.id,
          },
          projectMetadata: {
            ...collection.projectMetadata,
            cardOrders,
          },
          formMetadata,
        },
      );

      this.eventBus.publish(
        new DataAddedEvent(collection, filteredData, caller),
      );

      if (
        collection.collectionType === 0 &&
        (collection.formMetadata?.surveyTokenId ||
          collection.formMetadata?.surveyTokenId === 0)
      ) {
        try {
          await this.responseCredentialService.airdropResponseReceiptNFT(
            caller.ethAddress,
            null,
            collection,
          );
        } catch (e) {
          this.logger.error(
            `Failed to airdrop response receipt NFT for collection ${collection.id} with error ${e}`,
          );
        }
      }

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
          new GetPrivateViewCollectionQuery(updatedCollection.slug),
        );
      }
    } catch (err) {
      console.log({ err });
      this.logger.error(
        `Failed adding data to collection Id ${collectionId} with error ${err}`,
      );
      throw new InternalServerErrorException(`${err}`);
    }
  }

  filterUndefinedValues(data: object) {
    const filteredData = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        filteredData[key] = value;
      }
    }
    return filteredData;
  }

  async filterValuesWherePropertyDoesntSatisfyCondition(
    collection: Collection,
    data: object,
  ) {
    const filteredData = {};
    for (const [propertyId, property] of Object.entries(
      collection.properties,
    )) {
      if (property.advancedConditions?.order) {
        const satisfied = await this.queryBus.execute(
          new HasSatisfiedAdvancedDataConditionsQuery(
            collection,
            data,
            property.advancedConditions,
          ),
        );
        if (satisfied) filteredData[propertyId] = data[propertyId];
      } else {
        filteredData[propertyId] = data[propertyId];
      }
    }
    // add payment data if it exists
    if (
      collection.collectionType === 0 &&
      collection.formMetadata?.paymentConfig
    ) {
      filteredData['__payment__'] = data['__payment__'];
    }
    if (
      collection.collectionType === 0 &&
      collection.formMetadata?.ceramicEnabled
    ) {
      filteredData['__ceramic__'] = data['__ceramic__'];
    }
    if (collection.collectionType === 1) {
      filteredData['__cardStatus__'] = 'active';
    }

    return filteredData;
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
    private readonly activityOnAddData: ActivityOnAddData,
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
      const { dataActivities, dataActivityOrder } =
        this.activityOnAddData.getActivity(collection, data, botUser.id);
      const cardOrders = collection.projectMetadata?.cardOrders || {};
      if (Object.keys(cardOrders).length) {
        Object.keys(cardOrders).forEach((groupByColumn) => {
          const columnIndex = collection.properties[
            groupByColumn
          ].options.findIndex(
            (option) => option.value === data[groupByColumn]?.value,
          );
          try {
            cardOrders[groupByColumn][columnIndex + 1].push(data['slug']);
          } catch (e) {
            // initialising the empty columns if they dont exist till that last index
            for (
              let i = cardOrders[groupByColumn].length;
              i <= columnIndex + 1;
              i++
            ) {
              cardOrders[groupByColumn].push([]);
            }
            cardOrders[groupByColumn][columnIndex + 1].push(data['slug']);
          }
        });
      }

      await this.collectionRepository.updateById(collectionId, {
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
        projectMetadata: {
          ...collection.projectMetadata,
          cardOrders,
        },
      });
      // this.eventBus.publish(new DataAddedEvent(collection, data, botUser));
      // return await this.queryBus.execute(
      //   new GetPublicViewCollectionQuery(
      //     botUser,
      //     collection.slug,
      //     updatedCollection,
      //   ),
      // );
      return true;
    } catch (err) {
      this.logger.error(
        `Failed adding data to collection Id ${collectionId} with error ${err}`,
      );
      throw new InternalServerErrorException(
        `Failed adding data to collection Id ${collectionId} with error ${err}`,
      );
    }
  }
}

@CommandHandler(AddMultipleDataUsingAutomationCommand)
export class AddMultipleDataUsingAutomationCommandHandler
  implements ICommandHandler<AddMultipleDataUsingAutomationCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly validationService: DataValidationService,
    private readonly activityOnAddData: ActivityOnAddData,
  ) {
    this.logger.setContext('AddMultipleDataUsingAutomationCommandHandler');
  }

  async execute(command: AddMultipleDataUsingAutomationCommand) {
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
      const dataUpdates = collection.data || {};
      const dataOwners = collection.dataOwner || {};
      let projectMetadata = collection.projectMetadata || {};
      let dataActivities = collection.dataActivities || {};
      let dataActivityOrder = collection.dataActivityOrder || {};

      const filteredData = data.map((d) => {
        const obj = {};
        for (const i of Object.keys(d)) {
          if (d[i] !== undefined) obj[i] = d[i];
          if (
            typeof d[i] === 'number' &&
            collection.properties[i].type === 'shortText'
          )
            obj[i] = d[i].toString();
        }
        return obj;
      });
      for (const d of filteredData) {
        const validData = await this.validationService.validate(
          d,
          'add',
          true,
          collection,
        );

        if (!validData) {
          continue;
        }
        for (const [propertyId, property] of Object.entries(
          collection.properties,
        )) {
          if (property.default && !d[propertyId]) {
            d[propertyId] = property.default;
          }
        }
        d['slug'] = uuidv4();
        const act = this.activityOnAddData.getActivity(
          collection,
          d,
          botUser.id,
        );
        dataActivities = {
          ...dataActivities,
          ...act.dataActivities,
        };
        dataActivityOrder = {
          ...dataActivityOrder,
          ...act.dataActivityOrder,
        };
        const cardOrders = collection.projectMetadata?.cardOrders || {};
        if (Object.keys(cardOrders).length) {
          Object.keys(cardOrders).forEach((groupByColumn) => {
            const columnIndex = collection.properties[
              groupByColumn
            ].options.findIndex(
              (option) => option.value === d[groupByColumn]?.value,
            );
            try {
              cardOrders[groupByColumn][columnIndex + 1].push(d['slug']);
            } catch (e) {
              // initialising the empty columns if they dont exist till that last index
              for (
                let i = cardOrders[groupByColumn].length;
                i <= columnIndex + 1;
                i++
              ) {
                cardOrders[groupByColumn].push([]);
              }
              cardOrders[groupByColumn][columnIndex + 1].push(d['slug']);
            }
          });
        }
        dataUpdates[d['slug']] = d;
        dataOwners[d['slug']] = botUser.id;
        projectMetadata = {
          ...projectMetadata,
          cardOrders,
        };
      }
      return await this.collectionRepository.updateById(collectionId, {
        data: dataUpdates,
        dataActivities,
        dataActivityOrder,
        dataOwner: dataOwners,
        projectMetadata,
      });
    } catch (err) {
      this.logger.error(
        `Failed adding data to collection Id ${collectionId} with error ${JSON.stringify(
          err,
        )}`,
      );
      throw new InternalServerErrorException(
        `Failed adding data to collection Id ${collectionId} with error ${JSON.stringify(
          err,
        )}`,
      );
    }
  }
}

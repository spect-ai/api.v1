import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CollectionRepository } from 'src/collection/collection.repository';
import { MigrateAllCollectionsCommand } from '../impl/migrate-collection.command';
import { v4 as uuid } from 'uuid';
import { GetCircleBySlugQuery } from 'src/circle/queries/impl';
import { Circle } from 'src/circle/model/circle.model';
import { GetCollectionBySlugQuery } from 'src/collection/queries';
import { Collection } from 'src/collection/model/collection.model';
import { CirclesRepository } from 'src/circle/circles.repository';
import { SpectBase, SpectThemes } from '@avp1598/vibes';

@CommandHandler(MigrateAllCollectionsCommand)
export class MigrateAllCollectionsCommandHandler
  implements ICommandHandler<MigrateAllCollectionsCommand>
{
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly circleRepository: CirclesRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: MigrateAllCollectionsCommand) {
    const allCollections = await this.collectionRepository.findAll();

    for await (const collection of allCollections) {
      collection.formMetadata.theme = {
        layout: {
          ...SpectBase,
          colorPalette: SpectThemes.dark,
        },
        selectedLayout: 'spect',
        selectedTheme: 'dark',
      };
      console.log(
        '------------Migrating collection----------: ',
        collection.name,
      );
      await this.collectionRepository.updateById(collection.id, collection);
    }

    // const allCircles = await this.circleRepository.findAll();
    // for await (const circle of allCircles) {
    //   console.log('------------Migrating circle----------: ', circle.name);
    //   await this.circleRepository.updateById(circle.id, {
    //     pricingPlan: 0,
    //     topUpMembers: 0,
    //   });
    // }
    // for await (const circle of allCircles) {
    //   if (circle.version === 2) continue;
    //   console.log('------------Migrating circle----------: ', circle.name);
    //   if (circle.collections) {
    //     for await (const collectionId of circle.collections) {
    //       const collection = await this.collectionRepository.findById(
    //         collectionId.toString(),
    //       );
    //       if (collection.version === 2) continue;
    //       console.log(
    //         '------------Migrating collection----------: ',
    //         collection.name,
    //       );
    //       // deep copy of properties
    //       try {
    //         collection.legacyProperties = JSON.parse(
    //           JSON.stringify(collection.properties),
    //         );
    //       } catch (e) {
    //         console.log('error in collection', collection.id);
    //         continue;
    //       }
    //       const propMapping = collection.propertyOrder.reduce((acc, curr) => {
    //         if (
    //           collection.collectionType === 1 &&
    //           (curr === 'Title' || curr === 'Description')
    //         ) {
    //           acc[curr] = curr;
    //         } else {
    //           acc[curr] = uuid();
    //         }
    //         return acc;
    //       }, {});

    //       Object.keys(collection.properties).forEach((key) => {
    //         collection.properties[propMapping[key]] = {
    //           ...collection.properties[key],
    //           id: propMapping[key],
    //         };
    //         if (
    //           collection.properties[propMapping[key]].viewConditions?.length > 0
    //         ) {
    //           collection.properties[propMapping[key]].viewConditions.map(
    //             (condition) => {
    //               if (condition.data?.field?.value) {
    //                 condition.data.field.value =
    //                   propMapping[condition.data.field.value];
    //               }
    //             },
    //           );
    //         }
    //         collection.legacyProperties[key].id = propMapping[key];

    //         if (
    //           collection.collectionType === 1 &&
    //           (key === 'Title' || key === 'Description')
    //         ) {
    //           return;
    //         }
    //         delete collection.properties[key];
    //       });

    //       collection.propertyOrder = collection.propertyOrder.map(
    //         (prop) => propMapping[prop],
    //       );

    //       Object.keys(collection.data || {}).forEach((key) => {
    //         Object.keys(collection.data[key] || {}).forEach((dataKey) => {
    //           if (!propMapping[dataKey]) return;
    //           collection.data[key][propMapping[dataKey]] =
    //             collection.data[key][dataKey];
    //           if (
    //             collection.collectionType === 1 &&
    //             (dataKey === 'Title' || dataKey === 'Description')
    //           ) {
    //             return;
    //           }
    //           delete collection.data[key][dataKey];
    //         });
    //       });

    //       if (collection.collectionType === 0 && collection.formMetadata) {
    //         Object.keys(collection.formMetadata?.pages || {}).forEach((key) => {
    //           if (!collection.formMetadata.pages?.[key]?.properties) return;
    //           collection.formMetadata.pages[key].properties =
    //             collection.formMetadata.pages[key].properties.map(
    //               (prop) => propMapping[prop],
    //             );
    //         });

    //         if (collection.formMetadata.responseDataForMintkudos) {
    //           Object.keys(
    //             collection.formMetadata.responseDataForMintkudos,
    //           ).forEach((key) => {
    //             collection.formMetadata.responseDataForMintkudos[
    //               propMapping[key]
    //             ] = collection.formMetadata.responseDataForMintkudos[key];
    //             delete collection.formMetadata.responseDataForMintkudos[key];
    //           });
    //         }

    //         if (collection.formMetadata.responseDataForPoap) {
    //           Object.keys(collection.formMetadata.responseDataForPoap).forEach(
    //             (key) => {
    //               collection.formMetadata.responseDataForPoap[
    //                 propMapping[key]
    //               ] = collection.formMetadata.responseDataForPoap[key];
    //               delete collection.formMetadata.responseDataForPoap[key];
    //             },
    //           );
    //         }
    //       } else {
    //         Object.keys(collection.projectMetadata.cardOrders || {}).map(
    //           (key) => {
    //             collection.projectMetadata.cardOrders[propMapping[key]] =
    //               collection.projectMetadata.cardOrders[key];
    //             delete collection.projectMetadata.cardOrders[key];
    //           },
    //         );

    //         collection.projectMetadata.viewOrder?.map((view) => {
    //           if (!collection.projectMetadata.views?.[view]?.groupByColumn)
    //             return;
    //           collection.projectMetadata.views[view].groupByColumn =
    //             propMapping[
    //               collection.projectMetadata.views[view].groupByColumn
    //             ];

    //           collection.projectMetadata.views[view].sort.property =
    //             propMapping[
    //               collection.projectMetadata.views[view].sort.property
    //             ];

    //           collection.projectMetadata.views[view].filters?.map((filter) => {
    //             filter.data.field.value = propMapping[filter.data.field.value];
    //           });
    //         });
    //       }

    //       collection.version = 2;

    //       await this.collectionRepository.updateById(collection.id, collection);
    //     }
    //   }

    //   /*

    //   migrate automations of circle

    //   */

    //   for await (const automation of Object.values(circle.automations || {})) {
    //     console.log(
    //       '------------Migrating automation----------: ',
    //       automation.name,
    //     );

    //     const triggerCollection = await this.queryBus.execute(
    //       new GetCollectionBySlugQuery(automation.triggerCollectionSlug),
    //     );
    //     if (automation.trigger.data?.fieldName) {
    //       automation.trigger.data.fieldName =
    //         triggerCollection.legacyProperties[
    //           automation.trigger.data.fieldName
    //         ]?.id;
    //     }
    //     for await (const action of automation.actions) {
    //       if (action.id === 'createCard') {
    //         if (!action.data.selectedCollection) continue;
    //         const selectedCollection: Collection =
    //           await this.collectionRepository.findById(
    //             action.data.selectedCollection.value,
    //           );
    //         action.data.selectedCollection.data = {
    //           colectionType: selectedCollection.collectionType,
    //           id: selectedCollection.id,
    //           name: selectedCollection.name,
    //           properties: selectedCollection.properties,
    //           propertyOrder: selectedCollection.propertyOrder,
    //           slug: selectedCollection.slug,
    //         };
    //         action.data.values.map((value) => {
    //           if (value.type === 'mapping') {
    //             if (value.mapping.from.data?.fieldType === 'milestone') {
    //               value.mapping.from.value =
    //                 triggerCollection.legacyProperties[
    //                   value.mapping.from.data.fieldName
    //                 ]?.id;
    //             } else {
    //               if (
    //                 !triggerCollection.legacyProperties[
    //                   value.mapping.from.value
    //                 ]
    //               ) {
    //                 console.log(
    //                   '-----------------ERROR-----------------: with circle',
    //                   circle.id,
    //                 );
    //               }
    //               value.mapping.from.value =
    //                 triggerCollection.legacyProperties[
    //                   value.mapping.from.value
    //                 ]?.id;
    //             }
    //             if (value.mapping.from.data?.fieldName) {
    //               value.mapping.from.data.fieldName =
    //                 triggerCollection.legacyProperties[
    //                   value.mapping.from.data.fieldName
    //                 ]?.id;
    //             }
    //             value.mapping.to.value =
    //               selectedCollection.legacyProperties[
    //                 value.mapping.to.value
    //               ]?.id;
    //             if (value.mapping.to.data?.fieldName) {
    //               value.mapping.to.data.fieldName =
    //                 selectedCollection.legacyProperties[
    //                   value.mapping.to.data.fieldName
    //                 ]?.id;
    //             }
    //           } else if (value.type === 'responder') {
    //             value.mapping.to.value =
    //               selectedCollection.legacyProperties[
    //                 value.mapping.to.value
    //               ]?.id;
    //           } else if (value.type === 'default') {
    //             value.default.field.value =
    //               selectedCollection.legacyProperties[
    //                 value.default.field.value
    //               ]?.id;
    //           }
    //         });
    //       } else if (
    //         action.id === 'createDiscordThread' &&
    //         action.data.threadNameType === 'mapping'
    //       ) {
    //         action.data.threadName.value =
    //           triggerCollection.legacyProperties[
    //             action.data.threadName.value
    //           ]?.id;
    //       } else if (action.id === 'postOnDiscord') {
    //         action.data.fields?.map((field) => {
    //           field.value = triggerCollection.legacyProperties[field.value]?.id;
    //         });
    //       } else if (
    //         action.id === 'createDiscordChannel' &&
    //         action.data.channelNameType === 'mapping'
    //       ) {
    //         action.data.channelName.value =
    //           triggerCollection.legacyProperties[
    //             action.data.channelName.value
    //           ]?.id;
    //       }
    //     }

    //     for (const condition of automation.conditions) {
    //       condition.data.field.value =
    //         triggerCollection.legacyProperties[condition.data.field.value]?.id;
    //     }
    //   }

    //   circle.version = 2;
    //   await this.circleRepository.updateById(circle.id, circle);
    // }
  }
}

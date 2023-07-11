import {
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { Schema } from 'mongoose';
import { CircleAuthGuard } from 'src/auth/circle.guard';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CreatedCircleEvent } from 'src/circle/events/impl';
import { Circle } from 'src/circle/model/circle.model';
import { Automation, Folder } from 'src/circle/types';
import {
  DuplicateFormCommand,
  DuplicateProjectCommand,
} from 'src/collection/commands';
import { Collection } from 'src/collection/model/collection.model';
import { GetMultipleCollectionsQuery } from 'src/collection/queries';
import { SlugService } from 'src/common/slug.service';
import { defaultCircleCreatorRoles, defaultCircleRoles } from 'src/constants';
import { LoggingService } from 'src/logging/logging.service';
import { UseTemplateCircleSpecificInfoDto } from 'src/template/dto/useTemplateCircleSpecificInfoDto.dto';
import { DuplicateCircleCommand } from '../impl/duplicate-circle.command';
import { CommonTools } from 'src/common/common.service';

@CommandHandler(DuplicateCircleCommand)
export class DuplicateCircleCommandHandler
  implements ICommandHandler<DuplicateCircleCommand>
{
  constructor(
    private readonly circleRepository: CirclesRepository,
    private readonly logger: LoggingService,
    private readonly slugService: SlugService,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly circleAuthGuard: CircleAuthGuard,
    private readonly commonTools: CommonTools,
  ) {
    this.logger.setContext('DuplicateCircleCommandHandler');
  }

  isDiscordAutomation(actionType: string) {
    return [
      'createDiscordChannel',
      'giveDiscordRole',
      'removeDiscordRole',
      'postOnDiscord',
      'createDiscordThread',
      'postOnDiscordThread',
    ].includes(actionType);
  }

  hasDiscordAutomationAction(automation: Automation) {
    for (const action of automation.actions) {
      return this.isDiscordAutomation(action.type);
    }
    return false;
  }

  hasDiscordAutomation(circle: Circle) {
    for (const automation of Object.values(circle.automations)) {
      if (this.hasDiscordAutomationAction(automation)) {
        return true;
      }
    }
    return false;
  }

  getAutomationForNewCircle(
    circleId: string,
    automationInOldCircle: Automation,
    oldCollectionToNewCollectionMap: {
      [key: string]: Collection;
    },
    circleSpecificAutomationInfo?: UseTemplateCircleSpecificInfoDto,
  ): Automation {
    const newAutomation = { ...automationInOldCircle };
    if (newAutomation.triggerCollectionSlug) {
      newAutomation.triggerCollectionSlug =
        oldCollectionToNewCollectionMap[
          automationInOldCircle.triggerCollectionSlug
        ].slug;
    }
    const actions = [];
    for (let i = 0; i < automationInOldCircle.actions.length; i++) {
      const action = automationInOldCircle.actions[i];

      if (action.type === 'createCard') {
        action.data.selectedCollection.value =
          oldCollectionToNewCollectionMap[
            action.data.selectedCollection?.data?.slug
          ]?.id;
      } else if (
        this.isDiscordAutomation(action.type) &&
        !circleSpecificAutomationInfo?.actions?.length
      ) {
        console.log('skipping');
        continue;
      } else if (
        ['giveDiscordRole', 'removeDiscordRole'].includes(action.type)
      ) {
        let roles = {};
        if (circleSpecificAutomationInfo?.actions?.[i].info?.roleIds) {
          roles = circleSpecificAutomationInfo?.actions?.[
            i
          ].info.roleIds.reduce((acc, curr) => {
            acc[curr] = true;
            return acc;
          }, {});
        }
        action.data.roles = roles;
      } else if (['createDiscordChannel'].includes(action.type)) {
        action.data.channelCategory =
          circleSpecificAutomationInfo?.actions?.[i].info.category;
        let roles = {};
        if (circleSpecificAutomationInfo?.actions?.[i].info?.roleIds) {
          roles = circleSpecificAutomationInfo?.actions?.[
            i
          ].info.roleIds.reduce((acc, curr) => {
            acc[curr] = true;
            return acc;
          }, {});
        }
        action.data.rolesToAdd = roles;
      } else if (['postOnDiscord'].includes(action.type)) {
        action.data.channel =
          circleSpecificAutomationInfo?.actions?.[i].info.channel;
      } else if (['createDiscordThread'].includes(action.type)) {
        action.data.selectedChannel =
          circleSpecificAutomationInfo?.actions?.[i].info.channel;
        let roles = {};
        if (circleSpecificAutomationInfo?.actions?.[i].info?.roleIds) {
          roles = circleSpecificAutomationInfo?.actions?.[
            i
          ].info.roleIds.reduce((acc, curr) => {
            acc[curr] = true;
            return acc;
          }, {});
        }
        action.data.rolesToAdd = roles;
      }
      action.data.circleId = circleId;

      actions.push(action);
    }
    newAutomation.actions = actions;
    return newAutomation;
  }

  async execute(command: DuplicateCircleCommand) {
    const {
      caller,
      circleSlug,
      duplicateAutomations,
      duplicateCollections,
      duplicateMembership,
      destinationCircleId,
      useTemplateCircleSpecificInfoDto,
      discordGuildId,
    } = command;
    console.log('duplicateCircleCommand');
    try {
      // Get the circle to be duplicated
      const circle = await this.circleRepository.findOne({
        slug: circleSlug,
      });
      if (!circle)
        throw new NotFoundException(`Circle with slug ${circleSlug} not found`);

      if (!circle?.parents?.length)
        throw new UnauthorizedException(
          `You do not have permission to duplicate a parent space`,
        );

      // Get the parent circle or destination circle
      let parentCircle;
      if (circle?.parents?.length > 0 || destinationCircleId) {
        let parentCircleId = circle.parents[0];

        if (destinationCircleId) {
          parentCircleId =
            destinationCircleId as unknown as Schema.Types.ObjectId;
        }
        parentCircle = await this.circleRepository.findById(
          parentCircleId.toString(),
        );
      }

      // Check if the caller has permission to duplicate the circle to the destination circle / parent circle
      if (
        !this.circleAuthGuard.checkPermissions(
          ['manageCircleSettings'],
          parentCircle.memberRoles?.[caller.id] || [],
          parentCircle,
        )
      )
        throw new UnauthorizedException(
          `You do not have permission to duplicate this space`,
        );

      const slug = await this.slugService.generateUniqueSlug(
        circle.name,
        this.circleRepository,
      );

      // Create the membership for the new circle either by duplicating the membership from existing circle or creating a new one
      let membership = {};
      if (duplicateMembership) {
        membership = {
          members: circle.members,
          memberRoles: circle.memberRoles,
          roles: circle.roles,
        };
      } else {
        const memberRoles = {};
        memberRoles[caller.id] = defaultCircleCreatorRoles;

        membership = {
          members: [caller.id],
          memberRoles: memberRoles,
          roles: defaultCircleRoles,
        };
      }

      const folderOrder = circle.folderOrder;
      const folderDetails = {};
      for (const folderId of folderOrder) {
        folderDetails[folderId] = {
          ...circle.folderDetails[folderId],
          contentIds: [],
        };
      }
      // Create the new circle
      const createdCircle = await this.circleRepository.create({
        name:
          parentCircle.id !== circle.parents[0]
            ? `${circle.name}`
            : `${circle.name} (Copy)`,
        slug,
        description: circle.description,
        avatar: circle.avatar,
        parents: [parentCircle.id],
        ...membership,
        sidebarConfig: circle.sidebarConfig,
        children: [],
        collections: [],
        folderDetails,
        folderOrder,
        discordGuildId:
          discordGuildId === 'fromParent'
            ? parentCircle.discordGuildId
            : discordGuildId
            ? discordGuildId
            : circle.discordGuildId,
        localRegistry: circle.localRegistry,
      });

      // Update the parent circle with the new circle
      if (parentCircle) {
        // Get the folder id and folder index of the circle in the parent circle so the new circle can be added in the same folder. if
        // the circle has a different destination id than its current parent, then the circle is added to the first folder in the parent circle
        let folderIdOfCurrentCircleInParentCircle,
          indexOfCurrentCircle,
          currentCircleIdFolder;
        if (parentCircle.id === circle.parents[0]) {
          currentCircleIdFolder = Object.values(
            parentCircle.folderDetails,
          ).find((f: Folder) => f.contentIds.includes(circle.id)) as Folder;

          folderIdOfCurrentCircleInParentCircle = currentCircleIdFolder.id;
          indexOfCurrentCircle = currentCircleIdFolder.contentIds.indexOf(
            circle.id,
          );
        } else {
          folderIdOfCurrentCircleInParentCircle = parentCircle.folderOrder[0];
          currentCircleIdFolder =
            parentCircle.folderDetails[folderIdOfCurrentCircleInParentCircle];
          indexOfCurrentCircle = currentCircleIdFolder.contentIds.length - 1;
        }
        await this.circleRepository.updateById(parentCircle.id, {
          $push: {
            children: createdCircle._id,
          },
          folderDetails: {
            ...parentCircle.folderDetails,
            [folderIdOfCurrentCircleInParentCircle]: {
              ...currentCircleIdFolder,
              contentIds: [
                ...currentCircleIdFolder.contentIds.slice(
                  0,
                  indexOfCurrentCircle + 1,
                ),
                createdCircle.id,
                ...currentCircleIdFolder.contentIds.slice(
                  indexOfCurrentCircle + 1,
                ),
              ],
            },
          },
        });
      }

      // Duplicate the collections in the cirle
      // also, maintain a mapping so that the automations can be updated with the new collection ids
      const oldCollectionToNewCollectionMap = {} as {
        [key: string]: Collection;
      };

      if (circle.collections?.length && duplicateCollections) {
        const collections = await this.queryBus.execute(
          new GetMultipleCollectionsQuery({
            _id: circle.collections,
          }),
        );
        const collectionIdToOldCollectionMap = this.commonTools.objectify(
          collections,
          'id',
        );
        for (const folderId of circle.folderOrder) {
          const contentIds = circle.folderDetails[folderId].contentIds;
          for (const contentId of contentIds) {
            const collection = collectionIdToOldCollectionMap[contentId];
            if (!collection || collection.archived) continue;
            let newCollection;
            if (collection.collectionType === 0) {
              newCollection = await this.commandBus.execute(
                new DuplicateFormCommand(
                  collection.slug,
                  caller,
                  createdCircle.id,
                  folderId,
                ),
              );
            } else if (collection.collectionType === 1) {
              newCollection = await this.commandBus.execute(
                new DuplicateProjectCommand(
                  collection.slug,
                  caller,
                  createdCircle.id,
                  folderId,
                ),
              );
            }
            oldCollectionToNewCollectionMap[collection.slug] = newCollection;
          }
        }
      }

      let finalCircle = createdCircle;
      let automationCount = 0;
      // Duplicate the automations in the circle

      if (duplicateAutomations) {
        const currAutomations = circle.automations;
        const newAutomationsIndexedByCollection = {};
        const newAutomations = {};
        const automationIdToCircleSpecificInfoMap =
          useTemplateCircleSpecificInfoDto?.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
          }, {});
        for (const [collectionSlug, automationOrder] of Object.entries(
          circle.automationsIndexedByCollection,
        )) {
          const newCollectionSlug =
            oldCollectionToNewCollectionMap?.[collectionSlug]?.slug;
          if (newCollectionSlug) {
            if (!newAutomationsIndexedByCollection[newCollectionSlug]) {
              newAutomationsIndexedByCollection[newCollectionSlug] = [];
            }
            newAutomationsIndexedByCollection[newCollectionSlug] = [];
            automationCount += automationOrder.length;
            for (const automationId of automationOrder) {
              const newAutomation = this.getAutomationForNewCircle(
                createdCircle.id,
                currAutomations[automationId],
                oldCollectionToNewCollectionMap,
                automationIdToCircleSpecificInfoMap?.[automationId],
              );
              if (newAutomation?.actions?.length) {
                newAutomations[automationId] = newAutomation;
                newAutomationsIndexedByCollection[newCollectionSlug].push(
                  automationId,
                );
              }
            }
          }
        }
        finalCircle = await this.circleRepository.updateById(createdCircle.id, {
          automations: newAutomations,
          automationsIndexedByCollection: newAutomationsIndexedByCollection,
          rootAutomations: circle.rootAutomations,
          automationCount,
        });
      }

      this.eventBus.publish(new CreatedCircleEvent(createdCircle, null));

      return createdCircle;
    } catch (err) {
      this.logger.error(
        `Failed duplication of circle with slug ${circleSlug} with error ${err}`,
      );
      throw new InternalServerErrorException(`${err?.message || err}`);
    }
  }
}
import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CreateAutomationDto } from 'src/circle/dto/automation.dto';
import { CircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { UpdateCollectionCommand } from 'src/collection/commands';
import { UpdateCollectionDto } from 'src/collection/dto/update-collection-request.dto';
import { GetCollectionBySlugQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { v4 as uuidv4 } from 'uuid';
import { AddAutomationCommand } from '../impl';

@CommandHandler(AddAutomationCommand)
export class AddAutomationCommandHandler
  implements ICommandHandler<AddAutomationCommand>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly circlesRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AddAutomationCommandHandler');
  }
  async execute(command: AddAutomationCommand): Promise<CircleResponseDto> {
    try {
      const { circleId, createAutomationDto } = command;
      const circle = await this.circlesRepository.findById(circleId);
      const newAutomationId = uuidv4();
      const updates = {};
      updates['automations'] = {
        ...(circle.automations || {}),
        [newAutomationId]: {
          ...createAutomationDto,
          id: newAutomationId,
        },
      };
      if (createAutomationDto.triggerCategory === 'root') {
        updates['rootAutomations'] = [
          ...(circle.rootAutomations || []),
          newAutomationId,
        ];
      } else if (createAutomationDto.triggerCategory === 'collection') {
        if (!circle.automationsIndexedByCollection) {
          updates['automationsIndexedByCollection'] = {
            [createAutomationDto.triggerCollectionSlug]: [newAutomationId],
          };
        } else
          updates['automationsIndexedByCollection'] = {
            ...circle.automationsIndexedByCollection,
            [createAutomationDto.triggerCollectionSlug]: [
              ...(circle.automationsIndexedByCollection[
                createAutomationDto.triggerCollectionSlug
              ] || []),
              newAutomationId,
            ],
          };
      }
      updates['automationCount'] = (circle.automationCount || 0) + 1;
      await this.updateCollectionRequireDiscordConnection(
        createAutomationDto.triggerCollectionSlug,
        createAutomationDto,
      );
      updates['sidebarConfig'] = {
        ...(circle.sidebarConfig || {}),
        showAutomation: true,
      };
      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          circleId,
          updates,
        );
      return await this.circlesRepository.getCircleWithMinimalDetails(
        updatedCircle,
      );
    } catch (error) {
      console.log({ error });
      throw new InternalServerErrorException(error);
    }
  }

  private async updateCollectionRequireDiscordConnection(
    collectionSlug: string,
    addAutomationDto: CreateAutomationDto,
  ): Promise<void> {
    const collection = await this.queryBus.execute(
      new GetCollectionBySlugQuery(collectionSlug),
    );
    let requireDiscordConnection = false;
    for (const action of addAutomationDto.actions) {
      if (action.type === 'giveDiscordRole') {
        requireDiscordConnection = true;
      }
      if (
        action.type === 'createDiscordChannel' &&
        action.data?.isPrivate &&
        action.data?.addResponder
      ) {
        requireDiscordConnection = true;
      }
    }
    if (collection.requiredDiscordConnection && !requireDiscordConnection) {
      await this.commandBus.execute(
        new UpdateCollectionCommand(
          {
            formMetadata: {
              ...collection.formMetadata,
              discordConnectionRequired: false,
            },
          },
          null,
          collection._id.toString(),
        ),
      );
    } else if (
      !collection.requiredDiscordConnection &&
      requireDiscordConnection
    ) {
      await this.commandBus.execute(
        new UpdateCollectionCommand(
          {
            formMetadata: {
              ...collection.formMetadata,
              discordConnectionRequired: true,
            },
          },
          null,
          collection._id.toString(),
        ),
      );
    }
  }
}

import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { UpdateAutomationDto } from 'src/circle/dto/automation.dto';
import { CircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { UpdateCollectionCommand } from 'src/collection/commands';
import { UpdateCollectionDto } from 'src/collection/dto/update-collection-request.dto';
import { GetCollectionBySlugQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { UpdateAutomationCommand } from '../impl';

@CommandHandler(UpdateAutomationCommand)
export class UpdateAutomationCommandHandler
  implements ICommandHandler<UpdateAutomationCommand>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly circlesRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UpdateAutomationCommandHandler');
  }
  async execute(command: UpdateAutomationCommand): Promise<CircleResponseDto> {
    try {
      const { circleId, updateAutomationDto, automationId } = command;
      const circle = await this.circlesRepository.findById(circleId);
      const updates = {};
      updates['automations'] = {
        ...(circle.automations || {}),
        [automationId]: {
          ...circle.automations[automationId],
          ...updateAutomationDto,
        },
      };

      await this.updateCollectionRequireDiscordConnection(
        circle.automations[automationId].triggerCollectionSlug,
        updateAutomationDto,
      );

      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          circleId,
          updates,
        );
      return await this.circlesRepository.getCircleWithMinimalDetails(
        updatedCircle,
      );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  private async updateCollectionRequireDiscordConnection(
    collectionSlug: string,
    updateAutomationDto: UpdateAutomationDto,
  ): Promise<void> {
    const collection = await this.queryBus.execute(
      new GetCollectionBySlugQuery(collectionSlug),
    );
    let requireDiscordConnection = false;
    for (const action of updateAutomationDto.actions) {
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
            requireDiscordConnection: false,
          } as UpdateCollectionDto,
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
            requireDiscordConnection: true,
          } as UpdateCollectionDto,
          null,
          collection._id.toString(),
        ),
      );
    }
  }
}

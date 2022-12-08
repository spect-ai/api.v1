import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { UpdateCollectionCommand } from 'src/collection/commands';
import { UpdateCollectionDto } from 'src/collection/dto/update-collection-request.dto';
import { LoggingService } from 'src/logging/logging.service';
import { UpdateAutomationCommand } from '../impl';

@CommandHandler(UpdateAutomationCommand)
export class UpdateAutomationCommandHandler
  implements ICommandHandler<UpdateAutomationCommand>
{
  constructor(
    private readonly commandBus: CommandBus,
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

      if (
        circle.automations[automationId].trigger?.type === 'giveDiscordRole' &&
        updateAutomationDto.trigger?.type !== 'giveDiscordRole'
      ) {
        await this.commandBus.execute(
          new UpdateCollectionCommand(
            {
              requireDiscordConnection: false,
            } as UpdateCollectionDto,
            null,
            circle.automations[automationId].triggerCollectionSlug,
          ),
        );
      } else if (updateAutomationDto.trigger?.type === 'giveDiscordRole') {
        await this.commandBus.execute(
          new UpdateCollectionCommand(
            {
              requireDiscordConnection: true,
            } as UpdateCollectionDto,
            null,
            circle.automations[automationId].triggerCollectionSlug,
          ),
        );
      }

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
}

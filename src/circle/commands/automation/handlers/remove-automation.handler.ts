import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { LoggingService } from 'src/logging/logging.service';
import { RemoveAutomationCommand } from '../impl';

@CommandHandler(RemoveAutomationCommand)
export class RemoveAutomationCommandHandler
  implements ICommandHandler<RemoveAutomationCommand>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly circlesRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('RemoveAutomationCommandHandler');
  }
  async execute(command: RemoveAutomationCommand): Promise<CircleResponseDto> {
    try {
      const { circleId, automationId } = command;
      const circle = await this.circlesRepository.findById(circleId);

      const updates = {};
      if (circle.automations[automationId].triggerCategory === 'root') {
        updates['rootAutomations'] = circle.rootAutomations.filter(
          (id) => id !== automationId,
        );
      } else if (
        circle.automations[automationId].triggerCategory === 'collection'
      ) {
        updates['automationsIndexedByCollection'] = {
          ...circle.automationsIndexedByCollection,
          [circle.automations[automationId].triggerCollectionSlug]:
            circle.automationsIndexedByCollection[
              circle.automations[automationId].triggerCollectionSlug
            ].filter((id) => id !== automationId),
        };
      }

      delete circle.automations[automationId];
      updates['automations'] = circle.automations;
      updates['automationCount'] = circle.automationCount - 1;
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

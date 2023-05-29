import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { LoggingService } from 'src/logging/logging.service';
import { v4 as uuidv4 } from 'uuid';
import { AddAutomationCommand } from '../impl';

@CommandHandler(AddAutomationCommand)
export class AddAutomationCommandHandler
  implements ICommandHandler<AddAutomationCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AddAutomationCommandHandler');
  }
  async execute(command: AddAutomationCommand): Promise<CircleResponseDto> {
    try {
      const { circleId, createAutomationDto } = command;
      const circle = await this.circlesRepository.findById(circleId);
      if (circle.pricingPlan === 0 && circle.automationCount > 9) {
        throw new InternalServerErrorException(
          'You have reached the maximum number of automations for your plan. Please upgrade your plan to add more automations.',
        );
      }

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
}

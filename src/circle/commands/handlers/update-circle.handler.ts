import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { UpdatedCircleEvent } from 'src/circle/events/impl';
import { Circle } from 'src/circle/model/circle.model';
import {
  UpdateCircleCommand,
  UpdateMultipleCirclesCommand,
} from '../impl/update-circle.command';

@CommandHandler(UpdateCircleCommand)
export class UpdateCircleCommandHandler
  implements ICommandHandler<UpdateCircleCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: UpdateCircleCommand,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const { id, updateCircleDto, caller } = command;

      console.log({ updateCircleDto });

      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          id,
          updateCircleDto,
        );

      this.eventBus.publish(new UpdatedCircleEvent(updatedCircle, caller));

      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

@CommandHandler(UpdateMultipleCirclesCommand)
export class UpdateMultipleCircleCommandHandler
  implements ICommandHandler<UpdateMultipleCirclesCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateMultipleCirclesCommand): Promise<boolean> {
    try {
      const { updates } = command;

      console.log(updates);
      const res = await this.circlesRepository.bundleAndExecuteUpdates(updates);
      return true;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

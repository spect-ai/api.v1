import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { UpdateFolderOrderCommand } from '../impl';

@CommandHandler(UpdateFolderOrderCommand)
export class UpdateFolderOrderCommandHandler
  implements ICommandHandler<UpdateFolderOrderCommand>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly circlesRepository: CirclesRepository,
  ) {}
  async execute(
    command: UpdateFolderOrderCommand,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const { circleId, updateFolderOrderDto } = command;
      const folderOrder = updateFolderOrderDto.folderOrder;
      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          circleId,
          {
            folderOrder,
          },
        );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update folder Order',
        error.message,
      );
    }
  }
}

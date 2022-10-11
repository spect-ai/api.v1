import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import {
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DeleteFolderCommand } from '../impl';

@CommandHandler(DeleteFolderCommand)
export class DeleteFolderCommandHandler
  implements ICommandHandler<DeleteFolderCommand>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly circlesRepository: CirclesRepository,
  ) {}
  async execute(command: DeleteFolderCommand): Promise<CircleResponseDto> {
    try {
      const { circleId, folderId } = command;
      const circle = await this.circlesRepository.findById(circleId);

      if (!circle.folderDetails[folderId]) {
        throw new HttpException('Folder not found', HttpStatus.NOT_FOUND);
      }
      const folderDetails = circle.folderDetails;
      const folderOrder = circle.folderOrder;
      const folderIndex = circle.folderOrder.indexOf(folderId, 0);
      if (folderIndex > -1) {
        folderOrder.splice(folderIndex, 1);
      }
      if (folderId in folderDetails) {
        delete folderDetails[folderId];
      }

      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          circleId,
          {
            folderDetails,
            folderOrder,
          },
        );
      return await this.circlesRepository.getCircleWithMinimalDetails(
        updatedCircle,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update folder Order',
        error.message,
      );
    }
  }
}

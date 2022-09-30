import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { UpdateFolderCommand } from '../impl';

@CommandHandler(UpdateFolderCommand)
export class UpdateFolderCommandHandler
  implements ICommandHandler<UpdateFolderCommand>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly circlesRepository: CirclesRepository,
  ) {}
  async execute(
    command: UpdateFolderCommand,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const { circleId, folderId, updateFolderDto } = command;
      const circle = await this.circlesRepository.findById(circleId);

      if (!circle.folderDetails[folderId]) {
        throw new HttpException('Folder not found', HttpStatus.NOT_FOUND);
      }
      const folderDetails = circle.folderDetails;
      folderDetails[folderId] = {
        ...folderDetails[folderId],
        ...updateFolderDto,
      };

      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          circleId,
          {
            folderDetails,
          },
        );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update folder',
        error.message,
      );
    }
  }
}

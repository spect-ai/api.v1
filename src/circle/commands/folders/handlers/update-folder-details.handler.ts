import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { UpdateFolderDetailsCommand } from '../impl';

@CommandHandler(UpdateFolderDetailsCommand)
export class UpdateFolderDetailsCommandHandler
  implements ICommandHandler<UpdateFolderDetailsCommand>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly circlesRepository: CirclesRepository,
  ) {}
  async execute(
    command: UpdateFolderDetailsCommand,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const { circleId, updateFolderDetailsDto } = command;
      const circle = await this.circlesRepository.findById(circleId);

      const updateFolderDetails = updateFolderDetailsDto.folderDetails;

      let folderDetails = circle.folderDetails;
      folderDetails = {
        ...folderDetails,
        [updateFolderDetails[0]?.id]: {
          ...folderDetails[updateFolderDetails[0]?.id],
          contentIds: updateFolderDetails[0]?.contentIds,
        },
        [updateFolderDetails[1]?.id]: {
          ...folderDetails[updateFolderDetails[1]?.id],
          contentIds: updateFolderDetails[1]?.contentIds,
        },
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

import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DetailedCircleResponseDto } from 'src/circle/dto/detailed-circle-response.dto';
import { v4 as uuidv4 } from 'uuid';
import { CreateFolderCommand } from '../impl/create-folder.command';

@CommandHandler(CreateFolderCommand)
export class CreateFolderCommandHandler
  implements ICommandHandler<CreateFolderCommand>
{
  constructor(
    private readonly eventBus: EventBus,
    private readonly circlesRepository: CirclesRepository,
  ) {}
  async execute(
    command: CreateFolderCommand,
  ): Promise<DetailedCircleResponseDto> {
    try {
      const { circleId, createFolderDto } = command;
      const circle = await this.circlesRepository.findById(circleId);
      const folderOrder = circle.folderOrder || [];
      const folderDetails = circle.folderDetails || {};
      const newFolderId = uuidv4();
      const newFolder = {
        ...createFolderDto,
        id: newFolderId,
      };
      const newFolderDetails = {
        ...folderDetails,
        [newFolderId]: newFolder,
      };
      const newFolderOrder = [...folderOrder, newFolderId];
      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          circleId,
          {
            folderDetails: newFolderDetails,
            folderOrder: newFolderOrder,
          },
        );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

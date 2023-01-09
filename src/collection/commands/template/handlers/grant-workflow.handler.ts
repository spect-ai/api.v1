import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { LoggingService } from 'src/logging/logging.service';
import { CreateGrantWorkflowCommand } from '../impl/index';
import { v4 as uuidv4 } from 'uuid';
import { CollectionRepository } from 'src/collection/collection.repository';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { CreateCollectionCommand } from 'src/collection/commands';

@CommandHandler(CreateGrantWorkflowCommand)
export class CreateGrantWorkflowCommandHandler
  implements ICommandHandler<CreateGrantWorkflowCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly collectionRepository: CollectionRepository,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(CreateGrantWorkflowCommandHandler.name);
  }

  async execute(command: CreateGrantWorkflowCommand): Promise<Circle> {
    try {
      const { id, templateDto, caller } = command;
      const circle = await this.circlesRepository.findById(id);

      // 1. Create a Form
      const form = await this.commandBus.execute(
        new CreateCollectionCommand(
          {
            name: 'Grants Onboarding Form',
            circleId: id,
            collectionType: 0,
            privateResponses: true,
            description: ' ',
          },
          caller,
        ),
      );

      // 2. Create a Folder
      const folderOrder = circle.folderOrder || [];
      const folderDetails = circle.folderDetails || {};
      const newFolderId = uuidv4();
      const newFolder = {
        name: 'Grants Workflow',
        avatar: 'Grants Workflow',
        id: newFolderId,
        contentIds: [form?.id],
      };
      const newFolderDetails = {
        [newFolderId]: newFolder,
        ...folderDetails,
      };
      const newFolderOrder = [newFolderId, ...folderOrder];

      const updatedCircle =
        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          id,
          {
            folderDetails: newFolderDetails,
            folderOrder: newFolderOrder,
          },
        );
      return updatedCircle;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}

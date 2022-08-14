import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { ProjectsRepository } from 'src/project/project.repository';
import { UpdateAutomationCommand } from '../impl';

@CommandHandler(UpdateAutomationCommand)
export class UpdateAutomationCommandHandler
  implements ICommandHandler<UpdateAutomationCommand>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UpdateAutomationCommandHandler');
  }

  async execute(query: UpdateAutomationCommand): Promise<boolean> {
    try {
      console.log('UpdateAutomationCommandHandler');

      const { id, automationId, updateAutomationDto } = query;
      const project = await this.projectRepository.findById(id);

      const newAutomations = {
        ...project.automations,
        [automationId]: {
          ...project.automations[automationId],
          ...updateAutomationDto,
        },
      };

      const updatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          id,
          {
            automations: newAutomations,
          },
        );

      return true;
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(`Failed to update automation`);
    }
  }
}

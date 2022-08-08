import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { CreateAutomationCommand } from 'src/project/commands/automation/impl/create-automation.command';
import { ProjectsRepository } from 'src/project/project.repository';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(CreateAutomationCommand)
export class CreateAutomationCommandHandler
  implements ICommandHandler<CreateAutomationCommand>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CreateAutomationCommandHandler');
  }

  async execute(query: CreateAutomationCommand): Promise<boolean> {
    try {
      console.log('CreateAutomationCommandHandler');

      const { id, createAutomationDto } = query;
      const project = await this.projectRepository.findById(id);
      const automationOrder = project.automationOrder || [];
      const automations = project.automations || {};
      const newAutomationId = uuidv4();
      const newAutomation = {
        ...createAutomationDto,
        id: newAutomationId,
        active: true,
      };
      const newAutomations = {
        ...automations,
        [newAutomationId]: newAutomation,
      };
      const newAutomationOrder = [...automationOrder, newAutomationId];

      const udpatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          id,
          {
            automationOrder: newAutomationOrder,
            automations: newAutomations,
          },
        );

      return true;
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(`Failed to create automation`);
    }
  }
}

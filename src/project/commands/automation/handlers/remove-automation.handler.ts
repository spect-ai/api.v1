import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { ProjectsRepository } from 'src/project/project.repository';
import { RemoveAutomationCommand } from '../impl';

@CommandHandler(RemoveAutomationCommand)
export class RemoveAutomationCommandHandler
  implements ICommandHandler<RemoveAutomationCommand>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('RemoveAutomationCommandHandler');
  }

  async execute(query: RemoveAutomationCommand): Promise<boolean> {
    try {
      console.log('RemoveAutomationCommandHandler');

      const { id, automationId } = query;
      const project = await this.projectRepository.findById(id);

      delete project.automations[automationId];
      const newAutomationOrder = project.automationOrder.filter(
        (automationId) => automationId !== query.automationId,
      );
      const newProjectAutomationOrder = project.projectAutomationOrder?.filter(
        (automationId) => automationId !== query.automationId,
      );

      const updatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          id,
          {
            automations: project.automations[automationId],
            automationOrder: newAutomationOrder,
            projectAutomationOrder: newProjectAutomationOrder,
          },
        );

      return true;
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(`Failed to update automation`);
    }
  }
}

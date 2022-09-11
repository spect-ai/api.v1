import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { ProjectsRepository } from 'src/project/project.repository';
import { CreateCardTemplateCommand } from '../impl/create-template.command';

@CommandHandler(CreateCardTemplateCommand)
export class CreateCardTemplateCommandHandler
  implements ICommandHandler<CreateCardTemplateCommand>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CreateCardTemplateCommandHandler');
  }

  async execute(query: CreateCardTemplateCommand): Promise<boolean> {
    try {
      console.log('CreateCardTemplateCommandHandler');

      const { id, createCardTemplateDto } = query;
      const project = await this.projectRepository.findById(id);

      if (
        project.cardTemplates &&
        project.cardTemplates.hasOwnProperty(createCardTemplateDto.name)
      )
        throw 'Card template with a same name exists, please give an unique name';

      const cardTemplateOrder = [
        ...(project.cardTemplateOrder || []),
        createCardTemplateDto.name,
      ];

      const cardTemplates = {
        ...project.cardTemplates,
        [createCardTemplateDto.name]: createCardTemplateDto,
      };

      const udpatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          id,
          {
            cardTemplateOrder,
            cardTemplates,
          },
        );

      return true;
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(`Failed to create template`);
    }
  }
}

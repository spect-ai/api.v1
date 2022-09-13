import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { SlugService } from 'src/common/slug.service';
import {
  predefinedBountyTemplate,
  predefinedGrantTemplate,
  predefinedTaskTemplate,
} from 'src/constants';
import { LoggingService } from 'src/logging/logging.service';
import { CardsProjectService } from 'src/project/cards.project.service';
import {
  CreateProjectCommand,
  UpdateProjectByIdCommand,
  UpdateProjectCardNumByIdCommand,
} from 'src/project/commands/impl';
import { ColumnDetailsDto } from 'src/project/dto/column-details.dto';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { CreatedProjectEvent } from 'src/project/events/impl';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { MappedAutomation } from 'src/template/models/template.model';
import { TemplatesRepository } from 'src/template/tempates.repository';

@CommandHandler(CreateProjectCommand)
export class CreateProjectCommandHandler
  implements ICommandHandler<CreateProjectCommand>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly templateRepository: TemplatesRepository,
    private readonly slugService: SlugService,
    private readonly eventBus: EventBus,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CreateProjectCommandHandler');
  }

  async execute(command: CreateProjectCommand): Promise<Project> {
    const { caller, createProjectDto } = command;

    try {
      const slug = await this.slugService.generateUniqueSlug(
        createProjectDto.name,
        this.projectRepository,
      );

      let parentCircle: Circle;
      if (createProjectDto.circleId) {
        parentCircle = await this.queryBus.execute(
          new GetCircleByIdQuery(createProjectDto.circleId),
        );
      }

      if (createProjectDto.fromTemplateId) {
        const template = await this.templateRepository.getTemplate(
          createProjectDto.fromTemplateId,
        );
        const data = template.projectData;
        if (
          Object.keys(data).length > 0 &&
          'columnOrder' in data &&
          'columnDetails' in data
        ) {
          createProjectDto.columnOrder = data.columnOrder;
          createProjectDto.columnDetails =
            data?.columnDetails as ColumnDetailsDto;
          createProjectDto.automations = data?.automations as MappedAutomation;
          createProjectDto.automationOrder = data?.automationOrder;
        }
      }
      const cardTemplateOrder = [
        predefinedTaskTemplate.name,
        predefinedBountyTemplate.name,
        predefinedGrantTemplate.name,
      ];

      const cardTemplates = {
        [predefinedTaskTemplate.name]: predefinedTaskTemplate,
        [predefinedBountyTemplate.name]: predefinedBountyTemplate,
        [predefinedGrantTemplate.name]: predefinedGrantTemplate,
      };

      const properties = {
        ...predefinedTaskTemplate.properties,
        ...predefinedBountyTemplate.properties,
        ...predefinedGrantTemplate.properties,
      };
      const createdProject = await this.projectRepository.create({
        ...createProjectDto,
        slug: slug,
        parents: [parentCircle.id],
        cardTemplateOrder,
        cardTemplates,
        properties,
      });
      if (parentCircle?.id) {
        await this.commandBus.execute(
          new UpdateCircleCommand(
            parentCircle.id,
            {
              projects: [...(parentCircle.projects || []), createdProject.id],
            },
            caller,
          ),
        );
      }
      this.eventBus.publish(new CreatedProjectEvent(createdProject, caller));
      return createdProject;
    } catch (error) {
      this.logger.logError(
        `Failed project creation with error: ${error.message}`,
        caller,
      );
      throw new InternalServerErrorException(
        'Failed project creation',
        error.message,
      );
    }
  }
}

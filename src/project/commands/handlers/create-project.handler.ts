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
import { LoggingService } from 'src/logging/logging.service';
import { CardsProjectService } from 'src/project/cards.project.service';
import {
  UpdateProjectByIdCommand,
  UpdateProjectCardNumByIdCommand,
} from 'src/project/commands/impl';
import { ColumnDetailsDto } from 'src/project/dto/column-details.dto';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { CreatedProjectEvent } from 'src/project/events/impl';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { GetProjectByIdQuery } from 'src/project/queries/impl';
import { MappedAutomation } from 'src/template/models/template.model';
import { TemplatesRepository } from 'src/template/tempates.repository';
import { CreateProjectCommand } from '../impl/create-project.command';
import { ImportTrelloCommand } from '../import/impl';

@CommandHandler(CreateProjectCommand)
export class CreateProjectCommandHandler
  implements ICommandHandler<CreateProjectCommand>
{
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly templateRepository: TemplatesRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly slugService: SlugService,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('CreateProjectCommandHandler');
  }

  async execute(
    command: CreateProjectCommand,
  ): Promise<DetailedProjectResponseDto> {
    try {
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
            createProjectDto.automations =
              data?.automations as MappedAutomation;
            createProjectDto.automationOrder = data?.automationOrder;
          }
        }

        const createdProject = await this.projectRepository.create({
          ...createProjectDto,
          slug: slug,
          parents: [parentCircle.id],
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
        if (createProjectDto.trelloId) {
          await this.commandBus.execute(
            new ImportTrelloCommand(
              createdProject.id,
              createProjectDto.trelloId,
              caller,
            ),
          );
        }
        const updatedProject = await this.queryBus.execute(
          new GetProjectByIdQuery(createdProject.id),
        );
        return updatedProject;
      } catch (error) {
        this.logger.logError(
          `Failed project creation with error: ${error.message}`,
        );
        throw new InternalServerErrorException(
          'Failed project creation',
          error.message,
        );
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

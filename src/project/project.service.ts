import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CardsRepository } from 'src/card/cards.repository';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { SlugService } from 'src/common/slug.service';
import { MappedAutomation } from 'src/template/models/template.model';
import { TemplatesRepository } from 'src/template/tempates.repository';
import { RequestProvider } from 'src/users/user.provider';
import { v4 as uuidv4 } from 'uuid';
import { CardsProjectService } from './cards.project.service';
import { ColumnDetailsDto } from './dto/column-details.dto';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { UpdateColumnRequestDto } from './dto/update-column.dto';
import {
  AddViewDto,
  UpdateProjectRequestDto,
  UpdateViewDto,
} from './dto/update-project-request.dto';
import { Project } from './model/project.model';
import { ProjectsRepository } from './project.repository';
import { LoggingService } from 'src/logging/logging.service';
import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { CreatedProjectEvent } from './events/impl';
import { ImportTrelloCommand } from './commands/import/impl';
import { GetProjectByIdQuery } from './queries/impl';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly circlesRepository: CirclesRepository,
    private readonly slugService: SlugService,
    private readonly templateRepository: TemplatesRepository,
    private readonly cardRepository: CardsRepository,
    private readonly cardsProjectService: CardsProjectService,
    private readonly requestProvider: RequestProvider,
    private readonly logger: LoggingService,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    logger.setContext('ProjectService');
  }

  async getDetailedProject(id: string): Promise<DetailedProjectResponseDto> {
    try {
      const project =
        await this.projectRepository.getProjectWithPopulatedReferences(id);
      return this.cardsProjectService.projectPopulatedWithCardDetails(project);
    } catch (error) {
      this.logger.logError(
        `Failed while getting project by id with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed while getting project by id',
        error.message,
      );
    }
  }

  async getDetailedProjectBySlug(
    slug: string,
  ): Promise<DetailedProjectResponseDto> {
    try {
      const project =
        await this.projectRepository.getProjectWithPopulatedReferencesBySlug(
          slug,
        );
      return this.cardsProjectService.projectPopulatedWithCardDetails(project);
    } catch (error) {
      this.logger.logError(
        `Failed while getting project by slug with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed while getting project by slug',
        error.message,
      );
    }
  }

  async getProjectIdFromSlug(slug: string): Promise<Project> {
    const project = await this.projectRepository.getProjectIdFromSlug(slug);
    return project;
  }

  async create(createProjectDto: CreateProjectRequestDto): Promise<Project> {
    try {
      const slug = await this.slugService.generateUniqueSlug(
        createProjectDto.name,
        this.projectRepository,
      );

      let parentCircle: Circle;
      if (createProjectDto.circleId) {
        parentCircle =
          await this.circlesRepository.getCircleWithUnpopulatedReferences(
            createProjectDto.circleId,
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

      const createdProject = await this.projectRepository.create({
        ...createProjectDto,
        slug: slug,
        parents: [parentCircle.id],
      });
      if (parentCircle?.id) {
        await this.circlesRepository.updateById(parentCircle.id as string, {
          ...parentCircle,
          projects: [...parentCircle.projects, createdProject],
        });
      }
      this.eventBus.publish(
        new CreatedProjectEvent(createdProject, this.requestProvider.user?.id),
      );
      if (createProjectDto.trelloId) {
        await this.commandBus.execute(
          new ImportTrelloCommand(
            createdProject.id,
            createProjectDto.trelloId,
            this.requestProvider.user?.id,
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
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed project creation',
        error.message,
      );
    }
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectRequestDto,
  ): Promise<DetailedProjectResponseDto> {
    try {
      const updatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          id,
          updateProjectDto,
        );

      return this.cardsProjectService.projectPopulatedWithCardDetails(
        updatedProject,
      );
    } catch (error) {
      this.logger.logError(
        `Failed project update with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed project update',
        error.message,
      );
    }
  }

  async addColumn(projectId: string): Promise<DetailedProjectResponseDto> {
    try {
      const project =
        this.requestProvider.project ||
        (await this.projectRepository.findById(projectId));
      const columnOrder = project.columnOrder;
      const columnDetails = project.columnDetails;
      const newColumnId = uuidv4();
      const newColumn = {
        columnId: newColumnId,
        name: 'New Column',
        cards: [],
        defaultCardType: 'Task',
      };
      const newColumnDetails = {
        ...columnDetails,
        [newColumnId]: newColumn,
      };
      const newColumnOrder = [...columnOrder, newColumnId];

      const udpatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          projectId,
          {
            columnOrder: newColumnOrder,
            columnDetails: newColumnDetails,
          },
        );

      return this.cardsProjectService.projectPopulatedWithCardDetails(
        udpatedProject,
      );
    } catch (error) {
      this.logger.logError(
        `Failed column addition with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed column addition',
        error.message,
      );
    }
  }

  async deleteColumn(
    id: string,
    columnId: string,
  ): Promise<DetailedProjectResponseDto> {
    try {
      const project =
        this.requestProvider.project ||
        (await this.projectRepository.findById(id));

      const columnOrder = project.columnOrder;
      const columnDetails = project.columnDetails;
      const columnIndex = project.columnOrder.indexOf(columnId, 0);
      if (columnIndex > -1) {
        columnOrder.splice(columnIndex, 1);
      }
      let cards = [] as string[];
      if (columnId in columnDetails) {
        cards = project.columnDetails[columnId].cards;
        delete columnDetails[columnId];
      }

      await this.cardRepository.updateByFilter(
        {
          _id: {
            $in: cards,
          },
        },
        {
          'status.archived': true,
          'status.active': false,
        },
      );

      const udpatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          id,
          {
            columnOrder,
            columnDetails,
          },
        );

      return this.cardsProjectService.projectPopulatedWithCardDetails(
        udpatedProject,
      );
    } catch (error) {
      this.logger.logError(
        `Failed column deletion with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed column deletion',
        error.message,
      );
    }
  }

  async updateColumnDetails(
    id: string,
    columnId: string,
    updateColumnDto: UpdateColumnRequestDto,
  ): Promise<DetailedProjectResponseDto> {
    try {
      const project =
        this.requestProvider.project ||
        (await this.projectRepository.findById(id));

      if (!project.columnDetails[columnId]) {
        throw new HttpException('Column not found', HttpStatus.NOT_FOUND);
      }
      const columnDetails = project.columnDetails;
      columnDetails[columnId] = {
        ...columnDetails[columnId],
        ...updateColumnDto,
      };
      const updatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          id,
          {
            columnDetails,
          },
        );
      return this.cardsProjectService.projectPopulatedWithCardDetails(
        updatedProject,
      );
    } catch (error) {
      this.logger.logError(
        `Failed column update with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed column update',
        error.message,
      );
    }
  }

  async addView(
    projectId: string,
    addViewDto: AddViewDto,
  ): Promise<DetailedProjectResponseDto> {
    try {
      const project =
        this.requestProvider.project ||
        (await this.projectRepository.findById(projectId));
      const viewOrder = project.viewOrder || [];
      const viewDetails = project.viewDetails || {};
      const newViewId = uuidv4();
      const viewCount = project.viewCount || viewOrder.length;
      const newView = {
        ...addViewDto,
        viewId: newViewId,
        slug: `view-${viewCount}`,
      };
      const newViewDetails = {
        ...viewDetails,
        [newViewId]: newView,
      };
      const newViewOrder = [...viewOrder, newViewId];

      const udpatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          projectId,
          {
            viewOrder: newViewOrder,
            viewDetails: newViewDetails,
            viewCount: viewCount + 1,
          },
        );

      return this.cardsProjectService.projectPopulatedWithCardDetails(
        udpatedProject,
      );
    } catch (error) {
      this.logger.logError(
        `Failed view addition with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed view addition',
        error.message,
      );
    }
  }

  async updateView(
    id: string,
    viewId: string,
    updateColumnDto: UpdateViewDto,
  ): Promise<DetailedProjectResponseDto> {
    try {
      const project =
        this.requestProvider.project ||
        (await this.projectRepository.findById(id));

      if (!project.viewDetails[viewId]) {
        throw new HttpException('View not found', HttpStatus.NOT_FOUND);
      }
      const viewDetails = project.viewDetails;
      viewDetails[viewId] = {
        ...viewDetails[viewId],
        ...updateColumnDto,
      };
      const updatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          id,
          {
            viewDetails,
          },
        );
      return this.cardsProjectService.projectPopulatedWithCardDetails(
        updatedProject,
      );
    } catch (error) {
      this.logger.logError(
        `Failed view update with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed view update',
        error.message,
      );
    }
  }

  async deleteView(
    id: string,
    viewId: string,
  ): Promise<DetailedProjectResponseDto> {
    try {
      const project =
        this.requestProvider.project ||
        (await this.projectRepository.findById(id));

      const viewOrder = project.viewOrder;
      const viewDetails = project.viewDetails;
      const columnIndex = project.viewOrder.indexOf(viewId, 0);
      if (columnIndex > -1) {
        viewOrder.splice(columnIndex, 1);
      }
      if (viewId in viewDetails) {
        delete viewDetails[viewId];
      }

      const udpatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          id,
          {
            viewOrder,
            viewDetails,
          },
        );

      return this.cardsProjectService.projectPopulatedWithCardDetails(
        udpatedProject,
      );
    } catch (error) {
      this.logger.logError(
        `Failed view deletion with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed view deletion',
        error.message,
      );
    }
  }

  async delete(id: string): Promise<Project> {
    const project =
      this.requestProvider.project ||
      (await this.projectRepository.findById(id));

    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
    return await this.projectRepository.deleteById(id);
  }
}

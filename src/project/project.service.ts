import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ActionService } from 'src/card/actions.service';
import { CardsRepository } from 'src/card/cards.repository';
import { MultipleValidCardActionResponseDto } from 'src/card/dto/card-access-response.dto';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { SlugService } from 'src/common/slug.service';
import { MappedAutomation } from 'src/template/models/template.model';
import { TemplatesRepository } from 'src/template/tempates.repository';
import { v4 as uuidv4 } from 'uuid';
import { CardsProjectService } from './cards.project.service';
import { ColumnDetailsDto } from './dto/column-details.dto';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { UpdateColumnRequestDto } from './dto/update-column.dto';
import { UpdateProjectRequestDto } from './dto/update-project-request.dto';
import { Project } from './model/project.model';
import { ProjectsRepository } from './project.repository';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly circlesRepository: CirclesRepository,
    private readonly slugService: SlugService,
    private readonly templateRepository: TemplatesRepository,
    private readonly cardRepository: CardsRepository,
    private readonly actionService: ActionService,
    private readonly cardsProjectService: CardsProjectService,
  ) {}

  async getDetailedProject(id: string): Promise<DetailedProjectResponseDto> {
    const project =
      await this.projectRepository.getProjectWithPopulatedReferences(id);
    return this.cardsProjectService.projectPopulatedWithCardDetails(project);
  }

  async getDetailedProjectBySlug(
    slug: string,
  ): Promise<DetailedProjectResponseDto> {
    const project =
      await this.projectRepository.getProjectWithPopulatedReferencesBySlug(
        slug,
      );
    return this.cardsProjectService.projectPopulatedWithCardDetails(project);
  }

  async getProjectIdFromSlug(slug: string): Promise<Project> {
    const project = await this.projectRepository.getProjectIdFromSlug(slug);
    return project;
  }

  async getValidActions(
    slug: string,
  ): Promise<MultipleValidCardActionResponseDto> {
    const project =
      await this.projectRepository.getProjectWithUnpPopulatedReferencesBySlug(
        slug,
      );
    return await this.actionService.getValidActionsForMultipleCards(
      project.cards,
    );
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
          'columnDetails' in data &&
          'automations' in data &&
          'automationOrder' in data
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
      return createdProject;
    } catch (error) {
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
      throw new InternalServerErrorException(
        'Failed project update',
        error.message,
      );
    }
  }

  async addColumn(projectId: string): Promise<DetailedProjectResponseDto> {
    try {
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
      }
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
      throw new InternalServerErrorException(
        'Failed column deletion',
        error.message,
      );
    }
  }

  async deleteColumn(
    id: string,
    columnId: string,
  ): Promise<DetailedProjectResponseDto> {
    try {
      const project = await this.projectRepository.findById(id);
      if (!project) {
        throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
      }

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
      const project = await this.projectRepository.findById(id);
      if (!project) {
        throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
      }
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
      throw new InternalServerErrorException(
        'Failed column renaming',
        error.message,
      );
    }
  }

  async delete(id: string): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
    return await this.projectRepository.deleteById(id);
  }
}

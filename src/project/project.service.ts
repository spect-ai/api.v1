import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { SlugService } from 'src/common/slug.service';
import { TemplatesRepository } from 'src/template/tempates.repository';
import { ColumnDetailsDto } from './dto/column-details.dto';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { UpdateProjectRequestDto } from './dto/update-project-request.dto';
import { ColumnDetailsModel } from './model/columnDetails.model';
import { Project } from './model/project.model';
import { ProjectsRepository } from './project.repository';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly circlesRepository: CirclesRepository,
    private readonly slugService: SlugService,
    private readonly templateRepository: TemplatesRepository,
  ) {}

  async getDetailedProject(id: string): Promise<DetailedProjectResponseDto> {
    const project =
      await this.projectRepository.getProjectWithPopulatedReferences(id);
    return project;
  }

  async getDetailedProjectBySlug(
    slug: string,
  ): Promise<DetailedProjectResponseDto> {
    const project =
      await this.projectRepository.getProjectWithPopulatedReferencesBySlug(
        slug,
      );
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
        }
      }

      const createdProject = await this.projectRepository.create({
        ...createProjectDto,
        slug: slug,
        parents: [parentCircle._id],
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
        'Failed circle creation',
        error.message,
      );
    }
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectRequestDto,
  ): Promise<Project> {
    try {
      const updatedProject = await this.projectRepository.updateById(
        id,
        updateProjectDto,
      );
      return updatedProject;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed project update',
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

  async addCardToProject(
    projectId: ObjectId,
    columnId: string,
    cardSlug: string,
    cardId: ObjectId,
  ): Promise<Project> {
    const project = await this.projectRepository.findById(projectId.toString());
    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
    return await this.projectRepository
      .updateById(projectId.toString(), {
        ...project,
        cards: {
          ...project.cards,
          [cardSlug]: cardId,
        },
        columnDetails: {
          ...project.columnDetails,
          [columnId]: {
            ...project.columnDetails[columnId],
            cards: [...project.columnDetails[columnId].cards, cardSlug],
          },
        },
      })
      .populate('cards.$*');
  }
}

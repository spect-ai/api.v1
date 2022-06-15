import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Ref } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { SlugService } from 'src/common/slug.service';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { UpdateProjectRequestDto } from './dto/update-project-request.dto';
import { Project } from './model/project.model';
import { ProjectsRepository } from './project.repository';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly circlesRepository: CirclesRepository,
    private readonly slugService: SlugService,
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

      const createdProject = await this.projectRepository.create({
        ...createProjectDto,
        slug: slug,
        parents: [parentCircle._id],
      });

      if (parentCircle?.id) {
        await this.circlesRepository.updateById(parentCircle.id as string, {
          ...createProjectDto,
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
  ): Promise<Circle> {
    try {
      const updatedProject = await this.circlesRepository.updateById(
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
    const circle = await this.projectRepository.findById(id);
    if (!circle) {
      throw new HttpException('Circle not found', HttpStatus.NOT_FOUND);
    }
    return await this.projectRepository.deleteById(id);
  }
}

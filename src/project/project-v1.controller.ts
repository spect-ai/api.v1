import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { RequiredSlugDto } from 'src/common/dtos/string.dto';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { ProjectV1Service } from './project-v1.service';

@Controller('project/v1')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectV1Service,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('/:id')
  async findByObjectId(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.getDetailedProject(param.id);
  }

  @Get('/slug/:slug')
  async findBySlug(
    @Param() param: RequiredSlugDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.getDetailedProjectBySlug(param.slug);
  }
}

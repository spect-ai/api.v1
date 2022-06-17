import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { UpdateProjectRequestDto } from './dto/update-project-request.dto';
import { ProjectService } from './project.service';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('/:id')
  async findByObjectId(@Param('id') id): Promise<DetailedProjectResponseDto> {
    return await this.projectService.getDetailedProject(id);
  }

  @Get('/slug/:slug')
  async findBySlug(@Param('slug') slug): Promise<DetailedProjectResponseDto> {
    // temp fix to convert map to object
    let proj: any = await this.projectService.getDetailedProjectBySlug(slug);
    proj = {
      ...proj,
      cards: Object.fromEntries(proj.cards),
    };
    return proj;
  }

  @Post('/')
  async create(
    @Body() project: CreateProjectRequestDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.create(project);
  }

  @Patch('/:id')
  async update(
    @Param('id') id,
    @Body() project: UpdateProjectRequestDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.update(id, project);
  }

  @Post('/:id/delete')
  async delete(@Param('id') id): Promise<DetailedProjectResponseDto> {
    return await this.projectService.delete(id);
  }
}

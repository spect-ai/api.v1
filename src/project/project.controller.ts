import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { ReorderCardReqestDto } from './dto/reorder-card-request.dto';
import { UpdateColumnRequestDto } from './dto/update-column.dto';
import { UpdateProjectRequestDto } from './dto/update-project-request.dto';
import { Project } from './model/project.model';
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
    return await this.projectService.getDetailedProjectBySlug(slug);
  }

  @Post('/')
  async create(@Body() project: CreateProjectRequestDto): Promise<Project> {
    return await this.projectService.create(project);
  }

  @Patch('/:id')
  async update(
    @Param('id') id,
    @Body() project: UpdateProjectRequestDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.update(id, project);
  }

  @Patch('/:id/reorderCard/:cardId')
  async reorderCard(
    @Param('id') id,
    @Param('cardId') cardId,
    @Body() reorderCardRequestDto: ReorderCardReqestDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.reorderCard(
      id,
      cardId,
      reorderCardRequestDto,
    );
  }

  @Post('/:id/column/:columnId/delete')
  async deleteColumn(
    @Param('id') id,
    @Param('columnId') columnId,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.deleteColumn(id, columnId);
  }

  @Patch('/:id/column/:columnId/')
  async updateColumnDetails(
    @Param('id') id,
    @Param('columnId') columnId,
    @Body() updateColumnDetails: UpdateColumnRequestDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.updateColumnDetails(
      id,
      columnId,
      updateColumnDetails,
    );
  }

  @Post('/:id/delete')
  async delete(@Param('id') id): Promise<Project> {
    return await this.projectService.delete(id);
  }
}

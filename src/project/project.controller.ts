import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiParam } from '@nestjs/swagger';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { UpdateProjectRequestDto } from './dto/update-project-request.dto';
import { ProjectService } from './project.service';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('/:id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Object Id of the project',
    schema: { type: 'string' },
  })
  async findByObjectId(@Param('id') id): Promise<DetailedProjectResponseDto> {
    return await this.projectService.getDetailedProject(id);
  }

  @Post('/')
  @ApiBody({ type: CreateProjectRequestDto })
  async create(
    @Body() project: CreateProjectRequestDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.create(project);
  }

  @Patch('/:id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Object Id of the project',
    schema: { type: 'string' },
  })
  @ApiBody({ type: UpdateProjectRequestDto })
  async update(
    @Param('id') id,
    @Body() project: UpdateProjectRequestDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.update(id, project);
  }

  @Post('/:id/delete')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Object Id of the project',
    schema: { type: 'string' },
  })
  async delete(@Param('id') id): Promise<DetailedProjectResponseDto> {
    return await this.projectService.delete(id);
  }
}

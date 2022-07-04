import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { CardsProjectService } from './cards.project.service';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { ReorderCardReqestDto } from './dto/reorder-card-request.dto';
import { UpdateColumnRequestDto } from './dto/update-column.dto';
import { UpdateProjectRequestDto } from './dto/update-project-request.dto';
import { Project } from './model/project.model';
import { ProjectService } from './project.service';

@Controller('project')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly cardsProjectService: CardsProjectService,
  ) {}

  @Get('/:id')
  async findByObjectId(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.getDetailedProject(param.id);
  }

  @Get('/slug/:slug')
  async findBySlug(@Param('slug') slug): Promise<DetailedProjectResponseDto> {
    return await this.projectService.getDetailedProjectBySlug(slug);
  }

  @Post('/')
  @UseGuards(SessionAuthGuard)
  async create(@Body() project: CreateProjectRequestDto): Promise<Project> {
    return await this.projectService.create(project);
  }

  @Patch('/:id')
  @UseGuards(SessionAuthGuard)
  async update(
    @Param() param: ObjectIdDto,
    @Body() project: UpdateProjectRequestDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.update(param.id, project);
  }

  @Patch('/:id/column/add')
  @UseGuards(SessionAuthGuard)
  async addColumn(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.addColumn(param.id);
  }

  @Patch('/:id/column/:columnId/delete')
  @UseGuards(SessionAuthGuard)
  async deleteColumn(
    @Param() param: ObjectIdDto,
    @Param('columnId') columnId,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.deleteColumn(param.id, columnId);
  }

  @Patch('/:id/column/:columnId/')
  @UseGuards(SessionAuthGuard)
  async updateColumnDetails(
    @Param() param: ObjectIdDto,
    @Param('columnId') columnId,
    @Body() updateColumnDetails: UpdateColumnRequestDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.updateColumnDetails(
      param.id,
      columnId,
      updateColumnDetails,
    );
  }

  @Post('/:id/delete')
  @UseGuards(SessionAuthGuard)
  async delete(@Param() param: ObjectIdDto): Promise<Project> {
    return await this.projectService.delete(param.id);
  }
}

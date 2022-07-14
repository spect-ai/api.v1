import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import {
  CreateNewProjectAuthGuard,
  ProjectAuthGuard,
} from 'src/auth/project.guard';
import { MultipleValidCardActionResponseDto } from 'src/card/dto/card-access-response.dto';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import {
  RequiredColumnIdDto,
  RequiredSlugDto,
} from 'src/common/dtos/string.dto';
import { CardsProjectService } from './cards.project.service';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { UpdateColumnRequestDto } from './dto/update-column.dto';
import { UpdateProjectRequestDto } from './dto/update-project-request.dto';
import { Project } from './model/project.model';
import { ProjectService } from './project.service';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

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

  @SetMetadata('permissions', ['createNewProject'])
  @UseGuards(CreateNewProjectAuthGuard)
  @Post('/')
  async create(@Body() project: CreateProjectRequestDto): Promise<Project> {
    return await this.projectService.create(project);
  }

  @SetMetadata('permissions', ['manageProjectSettings'])
  @UseGuards(ProjectAuthGuard)
  @Patch('/:id')
  async update(
    @Param() param: ObjectIdDto,
    @Body() project: UpdateProjectRequestDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.update(param.id, project);
  }

  @UseGuards(SessionAuthGuard)
  @Get('/:slug/validActions')
  async getValidActions(
    @Param() param: RequiredSlugDto,
  ): Promise<MultipleValidCardActionResponseDto> {
    return await this.projectService.getValidActions(param.slug);
  }

  @SetMetadata('permissions', ['manageProjectSettings'])
  @UseGuards(ProjectAuthGuard)
  @Patch('/:id/column/add')
  async addColumn(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.addColumn(param.id);
  }

  @SetMetadata('permissions', ['manageProjectSettings'])
  @UseGuards(ProjectAuthGuard)
  @Patch('/:id/column/:columnId/delete')
  async deleteColumn(
    @Param() param: ObjectIdDto,
    @Param() columnIdParam: RequiredColumnIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.deleteColumn(
      param.id,
      columnIdParam.columnId,
    );
  }

  @SetMetadata('permissions', ['manageProjectSettings'])
  @UseGuards(ProjectAuthGuard)
  @Patch('/:id/column/:columnId/')
  async updateColumnDetails(
    @Param() param: ObjectIdDto,
    @Param() columnIdParam: RequiredColumnIdDto,
    @Body() updateColumnDetails: UpdateColumnRequestDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.projectService.updateColumnDetails(
      param.id,
      columnIdParam.columnId,
      updateColumnDetails,
    );
  }

  // TODO: Delete all the cards in the project aswell
  @SetMetadata('permissions', ['manageProjectSettings'])
  @UseGuards(ProjectAuthGuard)
  @Delete('/:id/delete')
  async delete(@Param() param: ObjectIdDto): Promise<Project> {
    return await this.projectService.delete(param.id);
  }
}

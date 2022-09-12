import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Request,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import {
  CreateNewProjectAuthGuard,
  ProjectAuthGuard,
  ViewProjectAuthGuard,
} from 'src/auth/project.guard';
import {
  CreateAutomationDto,
  UpdateAutomationDto,
} from 'src/automation/dto/automation.dto';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import {
  RequiredAutomationIdDto,
  RequiredSlugDto,
} from 'src/common/dtos/string.dto';
import { CreateAutomationCommand } from './commands/automation/impl/create-automation.command';
import { RemoveAutomationCommand } from './commands/automation/impl/remove-automation.command';
import { UpdateAutomationCommand } from './commands/automation/impl/update-automation.command';
import {
  ArchiveProjectCommand,
  CreateProjectCommand,
  RevertArchivedProjectCommand,
} from './commands/impl';
import { CreateCardTemplateCommand } from './commands/templates/impl/create-template.command';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { CreateCardTemplateDto } from './dto/update-project-request.dto';
import { Project } from './model/project.model';
import { CrudOrchestrator } from './orchestrators/crud-orchestrator.service';
import {
  GetDetailedProjectByIdQuery,
  GetDetailedProjectBySlugQuery,
  GetProjectByIdQuery,
  GetProjectBySlugQuery,
} from './queries/impl';

@Controller('project/v1')
export class ProjectV1Controller {
  constructor(
    private readonly crudOrchestrator: CrudOrchestrator,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @UseGuards(ViewProjectAuthGuard)
  @Get('/:id')
  async findByObjectId(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.queryBus.execute(
      new GetDetailedProjectByIdQuery(param.id),
    );
  }

  @UseGuards(ViewProjectAuthGuard)
  @Get('/slug/:slug')
  async findBySlug(
    @Param() param: RequiredSlugDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.queryBus.execute(
      new GetDetailedProjectBySlugQuery(param.slug),
    );
  }

  @SetMetadata('permissions', ['createNewProject'])
  @UseGuards(CreateNewProjectAuthGuard)
  @Post('/')
  async create(
    @Body() createProjectRequestDto: CreateProjectRequestDto,
    @Request() req,
  ): Promise<Project> {
    return await this.commandBus.execute(
      new CreateProjectCommand(req.user.id, createProjectRequestDto),
    );
  }

  @Patch('/:id/automation/create')
  async createAutomation(
    @Param() param: ObjectIdDto,
    @Body() createAutomationDto: CreateAutomationDto,
  ) {
    return await this.commandBus.execute(
      new CreateAutomationCommand(param.id, createAutomationDto),
    );
  }

  @Patch('/:id/automation/update')
  async updateAutomation(
    @Param() param: ObjectIdDto,
    @Query() query: RequiredAutomationIdDto,
    @Body() updateAutomationDto: UpdateAutomationDto,
  ) {
    return await this.commandBus.execute(
      new UpdateAutomationCommand(
        param.id,
        query.automationId,
        updateAutomationDto,
      ),
    );
  }

  @Patch('/:id/automation/remove')
  async removeAutomation(
    @Param() param: ObjectIdDto,
    @Query() query: RequiredAutomationIdDto,
  ) {
    return await this.commandBus.execute(
      new RemoveAutomationCommand(param.id, query.automationId),
    );
  }

  @Patch('/:id/archive')
  async archive(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.commandBus.execute(new ArchiveProjectCommand(param.id));
  }

  @SetMetadata('permissions', ['manageProjectSettings'])
  @UseGuards(ProjectAuthGuard)
  @Patch('/:id/revertArchive')
  async revertArchive(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.commandBus.execute(
      new RevertArchivedProjectCommand(param.id),
    );
  }

  @SetMetadata('permissions', ['manageProjectSettings'])
  @UseGuards(ProjectAuthGuard)
  @Patch('/:id/createCardTemplate')
  async createCardTemplate(
    @Param() param: ObjectIdDto,
    @Body() createCardTemplateDto: CreateCardTemplateDto,
  ): Promise<boolean> {
    return await this.commandBus.execute(
      new CreateCardTemplateCommand(param.id, createCardTemplateDto),
    );
  }
}

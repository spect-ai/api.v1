import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ProjectAuthGuard, ViewProjectAuthGuard } from 'src/auth/project.guard';
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
  RevertArchivedProjectCommand,
} from './commands/impl';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { CrudOrchestrator } from './orchestrators/crud-orchestrator.service';
import {
  GetDetailedProjectByIdQuery,
  GetDetailedProjectBySlugQuery,
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

  @SetMetadata('permissions', ['manageProjectSettings'])
  @UseGuards(ProjectAuthGuard)
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
}

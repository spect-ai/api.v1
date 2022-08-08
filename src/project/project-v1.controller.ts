import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
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
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { ProjectV1Service } from './project-v1.service';

@Controller('project/v1')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectV1Service,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
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

  @Patch('/:id/automation/create')
  async create(
    @Param() param: ObjectIdDto,
    @Body() createAutomationDto: CreateAutomationDto,
  ) {
    return await this.commandBus.execute(
      new CreateAutomationCommand(param.id, createAutomationDto),
    );
  }

  @Patch('/:id/automation/update')
  async update(
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
  async remove(
    @Param() param: ObjectIdDto,
    @Query() query: RequiredAutomationIdDto,
  ) {
    return await this.commandBus.execute(
      new RemoveAutomationCommand(param.id, query.automationId),
    );
  }
}

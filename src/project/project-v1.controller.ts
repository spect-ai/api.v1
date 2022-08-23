import {
  Controller,
  Get,
  Param,
  Patch,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ProjectAuthGuard, ViewProjectAuthGuard } from 'src/auth/project.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { RequiredSlugDto } from 'src/common/dtos/string.dto';
import {
  ArchiveProjectCommand,
  RevertArchivedProjectCommand,
} from './commands/impl';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { CrudOrchestrator } from './orchestrators/crud-orchestrator.service';
import { GetProjectByIdQuery, GetProjectBySlugQuery } from './queries/impl';

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
    return await this.crudOrchestrator.getDetailedProject(param.id);
  }

  @UseGuards(ViewProjectAuthGuard)
  @Get('/slug/:slug')
  async findBySlug(
    @Param() param: RequiredSlugDto,
  ): Promise<DetailedProjectResponseDto> {
    console.log(param.slug);
    const res = await this.crudOrchestrator.getDetailedProjectBySlug(
      param.slug,
    );
    console.log(res);
    return res;
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

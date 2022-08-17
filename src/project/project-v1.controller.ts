import { Controller, Get, Param, Patch } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { RequiredSlugDto } from 'src/common/dtos/string.dto';
import {
  ArchiveProjectCommand,
  RevertArchivedProjectCommand,
} from './commands/impl';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { ProjectV1Service } from './project-v1.service';
import { GetProjectByIdQuery, GetProjectBySlugQuery } from './queries/impl';

@Controller('project/v1')
export class ProjectV1Controller {
  constructor(
    private readonly projectService: ProjectV1Service,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('/:id')
  async findByObjectId(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.queryBus.execute(new GetProjectByIdQuery(param.id));
  }

  @Get('/slug/:slug')
  async findBySlug(
    @Param() param: RequiredSlugDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.queryBus.execute(new GetProjectBySlugQuery(param.slug));
  }

  @Patch('/:id/archive')
  async archive(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.commandBus.execute(new ArchiveProjectCommand(param.id));
  }

  @Patch('/:id/revertArchive')
  async revertArchive(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.commandBus.execute(
      new RevertArchivedProjectCommand(param.id),
    );
  }
}

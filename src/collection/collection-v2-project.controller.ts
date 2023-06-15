import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Request,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import {
  CollectionAuthGuard,
  StrongerCollectionAuthGuard,
} from 'src/auth/collection.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { LoggingService } from 'src/logging/logging.service';
import { AddProjectDataCommand } from './commands/data/v2/impl/add-data.command';
import {
  AddProjectDataDto,
  UpdateDataDto,
} from './dto/update-data-request.dto';
import { Collection } from './model/collection.model';
import { DuplicateProjectCommand, UpdateProjectDataCommand } from './commands';
import { RequiredUUIDDto } from 'src/common/dtos/string.dto';
import { RequiredSlugDto } from 'src/common/dtos/string.dto';

/**
 Built with keeping integratoors in mind, this API is meant to
    1. Simplify responses for integrators
    2. Reduce the payload size of large responses & group similar data together (which we will later use to optimize requests from our frontend)
    3. Implement limit, offset and pagination for large responses
    4. Reduce number of lines in controller code
 **/

@Controller('collection/v2/project')
@ApiTags('collection.v2')
export class CollectionV2ProjectController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(CollectionV2ProjectController.name);
  }

  @SetMetadata('permissions', ['updateResponsesManually'])
  @UseGuards(CollectionAuthGuard)
  @Patch('/slug/:slug/addDataGuarded')
  async addDataGuarded(
    @Param() param: RequiredSlugDto,
    @Body() addDataDto: AddProjectDataDto,
    @Query('atomic') atomic: string, // if true, then the update will be atomic, ie, if validation fails for one field it wont write the data. If false, data will be written for fields where validation passed
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new AddProjectDataCommand(
        addDataDto.data,
        req.user,
        param.slug,
        true,
        atomic === 'false' ? false : true,
      ),
    );
  }

  @SetMetadata('permissions', ['updateResponsesManually'])
  @UseGuards(CollectionAuthGuard)
  @Patch('/slug/:slug/updateDataGuarded')
  async updateDataGuarded(
    @Param() param: RequiredSlugDto,
    @Query() dataSlugParam: RequiredUUIDDto,
    @Body() updateDataDto: UpdateDataDto,
    @Query('atomic') atomic: string, // if true, then the update will be atomic, ie, if validation fails for one field it wont write the data. If false, data will be written for fields where validation passed
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new UpdateProjectDataCommand(
        updateDataDto.data,
        req.user,
        param.slug,
        dataSlugParam.dataId,
        atomic === 'false' ? false : true,
      ),
    );
  }
}

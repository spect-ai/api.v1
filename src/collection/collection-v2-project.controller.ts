import {
  Body,
  Controller,
  Param,
  Patch,
  Query,
  Request,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { CollectionAuthGuard } from 'src/auth/collection.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { LoggingService } from 'src/logging/logging.service';
import { AddProjectDataCommand } from './commands/data/v2/impl/add-data.command';
import {
  AddProjectDataDto,
  UpdateDataDto,
} from './dto/update-data-request.dto';
import { Collection } from './model/collection.model';
import { UpdateProjectDataCommand } from './commands';
import { RequiredUUIDDto } from 'src/common/dtos/string.dto';

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
  @Patch('/:id/addDataGuarded')
  async addDataGuarded(
    @Param() param: ObjectIdDto,
    @Body() addDataDto: AddProjectDataDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new AddProjectDataCommand(addDataDto.data, req.user, param.id, false),
    );
  }

  @SetMetadata('permissions', ['updateResponsesManually'])
  @UseGuards(CollectionAuthGuard)
  @Patch('/:id/updateDataGuarded')
  async updateDataGuarded(
    @Param() param: ObjectIdDto,
    @Query() dataSlugParam: RequiredUUIDDto,
    @Body() updateDataDto: UpdateDataDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new UpdateProjectDataCommand(
        updateDataDto.data,
        req.user,
        param.id,
        dataSlugParam.dataId,
      ),
    );
  }
}

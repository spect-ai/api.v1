import {
  Controller,
  Get,
  Param,
  Patch,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { StrongerCollectionAuthGuard } from 'src/auth/collection.guard';
import { RequiredSlugDto } from 'src/common/dtos/string.dto';
import { LoggingService } from 'src/logging/logging.service';
import { GetCollectionBySlugQuery } from './queries';

/**
 Built with keeping integratoors in mind, this API is meant to
    1. Simplify responses for integrators
    2. Reduce the payload size of large responses & group similar data together (which we will later use to optimize requests from our frontend)
    3. Implement limit, offset and pagination for large responses
    4. Reduce number of lines in controller code
 **/

@Controller('collection/v2/form')
@ApiTags('collection.v2')
export class CollectionV2FormController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(CollectionV2FormController.name);
  }

  @SetMetadata('permissions', ['manageSettings'])
  @UseGuards(StrongerCollectionAuthGuard)
  @Get('/slug/:slug/responderProfilePlugin')
  async getResponderProfilePlugin(
    @Param() param: RequiredSlugDto,
  ): Promise<any> {
    return await this.queryBus.execute(
      new GetCollectionBySlugQuery(
        param.slug,
        {},
        {
          'formMetadata.lookup': 1,
        },
      ),
    );
  }
}

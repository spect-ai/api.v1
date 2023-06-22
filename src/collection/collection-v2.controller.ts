import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import {
  CollectionAuthGuard,
  StrongerCollectionAuthGuard,
  ViewCollectionAuthGuard,
} from 'src/auth/collection.guard';
import { RequiredSlugDto } from 'src/common/dtos/string.dto';
import { CollectionDataResponseDto } from './dto/v2/collection-response.dto';
import { GetCollectionBySlugQuery } from './queries';
import { LoggingService } from 'src/logging/logging.service';
import { MoveCollectionCommand } from './commands';

/**
 Built with keeping integratoors in mind, this API is meant to
    1. Simplify responses for integrators
    2. Reduce the payload size of large responses & group similar data together (which we will later use to optimize requests from our frontend)
    3. Implement limit, offset and pagination for large responses
    4. Reduce number of lines in controller code
 **/

@Controller('collection/v2')
@ApiTags('collection.v2')
export class CollectionV2Controller {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(CollectionV2Controller.name);
  }

  @SetMetadata('permissions', ['viewResponses'])
  @UseGuards(ViewCollectionAuthGuard)
  @Get('/slug/:slug')
  async getCollectionBySlug(
    @Param() param: RequiredSlugDto,
  ): Promise<CollectionDataResponseDto> {
    const res = await this.queryBus.execute(
      new GetCollectionBySlugQuery(
        param.slug,
        {},
        {
          id: 1,
          name: 1,
          slug: 1,
          description: 1,
          collectionType: 1,
          properties: 1,
          propertyOrder: 1,
          'formMetadata.pages': 1,
          'formMetadata.pageOrder': 1,
        },
      ),
    );

    if (res.collectionType === 0) delete res.propertyOrder;
    else delete res.formMetadata;
    return res;
  }

  @SetMetadata('permissions', ['viewResponses'])
  @UseGuards(StrongerCollectionAuthGuard)
  @Get('/slug/:slug/data')
  async getDataByCollectionSlug(
    @Param() param: RequiredSlugDto,
  ): Promise<CollectionDataResponseDto> {
    return await this.queryBus.execute(
      new GetCollectionBySlugQuery(
        param.slug,
        {},
        {
          id: 1,
          name: 1,
          slug: 1,
          description: 1,
          properties: 1,
          data: 1,
        },
      ),
    );
  }

  @SetMetadata('permissions', ['manageSettings'])
  @UseGuards(StrongerCollectionAuthGuard)
  @Patch('/slug/:slug/move')
  async moveCollection(
    @Param() param: RequiredSlugDto,
    @Query('circleId') circleId: string,
    @Req() req: any,
  ): Promise<CollectionDataResponseDto> {
    const res = await this.commandBus.execute(
      new MoveCollectionCommand(param.slug, circleId, req.user),
    );

    return res;
  }
}

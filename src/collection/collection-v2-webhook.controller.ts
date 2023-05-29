import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
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
import { CreateSubscriptionToEventDto } from './dto/v2/subcription.dto';
import { RemoveSubscriptionCommand, SubscribeToEventCommand } from './commands';

/**
 Built with keeping integratoors in mind, this API is meant to
    1. Simplify responses for integrators
    2. Reduce the payload size of large responses & group similar data together (which we will later use to optimize requests from our frontend)
    3. Implement limit, offset and pagination for large responses
    4. Reduce number of lines in controller code
 **/

@Controller('collection/v2/webhook')
@ApiTags('collection.v2.webhook')
export class CollectionV2Controller {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(CollectionV2Controller.name);
  }

  @SetMetadata('permissions', ['manageSettings'])
  @UseGuards(StrongerCollectionAuthGuard)
  @Patch('/slug/:slug/subscribe')
  async subscribe(
    @Param() param: RequiredSlugDto,
    @Body() body: CreateSubscriptionToEventDto,
  ): Promise<CollectionDataResponseDto> {
    return await this.commandBus.execute(
      new SubscribeToEventCommand(param.slug, body),
    );
  }

  @SetMetadata('permissions', ['manageSettings'])
  @UseGuards(StrongerCollectionAuthGuard)
  @Patch('/slug/:slug/unsubscribe')
  async unsubscribe(
    @Param() param: RequiredSlugDto,
    @Query('eventName') eventName: string,
    @Query('id') id: string,
  ): Promise<CollectionDataResponseDto> {
    return await this.queryBus.execute(
      new RemoveSubscriptionCommand(param.slug, eventName, id),
    );
  }
}

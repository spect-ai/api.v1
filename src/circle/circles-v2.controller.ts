import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { CircleAuthGuard, ViewCircleAuthGuard } from 'src/auth/circle.guard';
import {
  DuplicateFormCommand,
  DuplicateProjectCommand,
  MoveCollectionCommand,
} from 'src/collection/commands';
import { CollectionDataResponseDto } from 'src/collection/dto/v2/collection-response.dto';
import { Collection } from 'src/collection/model/collection.model';
import { RequiredSlugDto } from 'src/common/dtos/string.dto';
import { DuplicateCircleCommand } from './commands/impl';
import { MoveCircleCommand } from './commands/v2/impl/move-circle.command';
import { Circle } from './model/circle.model';
import { GetCircleBySlugQuery } from './queries/impl';

/**
 Built with keeping integratoors in mind, this API is meant to
    1. Simplify responses for integrators
    2. Reduce the payload size of large responses & group similar data together (which we will later use to optimize requests from our frontend)
    3. Implement limit, offset and pagination for large responses
    4. Reduce number of lines in controller code
 **/

const circlePopulatedFields = {
  id: 1,
  name: 1,
  slug: 1,
  description: 1,
  avatar: 1,
  createdAt: 1,
};

const collectionPopulatedFields = {
  id: 1,
  name: 1,
  slug: 1,
  description: 1,
  collectionType: 1,
  createdAt: 1,
};

@Controller('circle/v2')
@ApiTags('circle.v2')
export class CircleV2Controller {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @UseGuards(ViewCircleAuthGuard)
  @Get('/slug/:slug/entities')
  async findEntitiesInCircle(
    @Param() param: RequiredSlugDto,
    @Query('entityType') entityType: 'workstream' | 'form' | 'project',
  ): Promise<Partial<Collection>[] | Partial<Circle[]>> {
    const circle = await this.queryBus.execute(
      new GetCircleBySlugQuery(
        param.slug,
        {
          parents: circlePopulatedFields,
          children: circlePopulatedFields,
          collections: collectionPopulatedFields,
        },
        {
          id: 1,
          name: 1,
          description: 1,
          slug: 1,
          parents: 1,
          children: 1,
          collections: 1,
          createdAt: 1,
        },
      ),
    );

    if (['form', 'project'].includes(entityType)) {
      const collectionType = entityType === 'form' ? 0 : 1;
      const returnedCollections = [];
      for (const collection of circle.collections) {
        if (collection.collectionType === collectionType) {
          returnedCollections.push(collection);
        }
      }
      return returnedCollections;
    } else if (entityType === 'workstream') {
      return circle.children;
    } else return circle;
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Post('/slug/:slug/move')
  async move(
    @Param() param: RequiredSlugDto,
    @Query('destinationCircleId') destinationCircleId: string,
    @Req() req: any,
  ): Promise<CollectionDataResponseDto> {
    const res = await this.commandBus.execute(
      new MoveCircleCommand(param.slug, destinationCircleId, req.user),
    );

    return res;
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Post('/slug/:slug/duplicate')
  async duplicate(
    @Param() param: RequiredSlugDto,
    @Query('circleIdBeingDuplicated') circleIdBeingDuplicated: string,
    @Req() req: any,
    @Query('duplicateAutomations') duplicateAutomations?: boolean,
    @Query('duplicateCollections') duplicateCollections?: boolean,
    @Query('duplicateMembership') duplicateMembership?: boolean,
    @Query('destinationCircleId') destinationCircleId?: string,
  ): Promise<any> {
    console.log('duplicate');
    return await this.commandBus.execute(
      new DuplicateCircleCommand(
        circleIdBeingDuplicated,
        req.user,
        duplicateAutomations,
        duplicateCollections,
        duplicateMembership,
        destinationCircleId,
      ),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Post('/slug/:slug/moveCollection')
  async moveCollection(
    @Param() param: RequiredSlugDto,
    @Query('collectionSlug') collectionSlug: string,
    @Query('destinationCircleId') destinationCircleId: string,
    @Req() req: any,
  ): Promise<CollectionDataResponseDto> {
    const res = await this.commandBus.execute(
      new MoveCollectionCommand(collectionSlug, destinationCircleId, req.user),
    );

    return res;
  }

  @SetMetadata('permissions', ['createNewForm'])
  @UseGuards(CircleAuthGuard)
  @Post('/slug/:slug/duplicateForm')
  async duplicateForm(
    @Param() param: RequiredSlugDto,
    @Query('collectionSlug') collectionSlug: string,
    @Req() req: any,
  ): Promise<any> {
    return await this.commandBus.execute(
      new DuplicateFormCommand(collectionSlug, req.user),
    );
  }

  @SetMetadata('permissions', ['createNewForm'])
  @UseGuards(CircleAuthGuard)
  @Post('/slug/:slug/duplicateProject')
  async duplicateProject(
    @Param() param: RequiredSlugDto,
    @Query('collectionSlug') collectionSlug: string,
    @Req() req: any,
  ): Promise<any> {
    return await this.commandBus.execute(
      new DuplicateProjectCommand(collectionSlug, req.user),
    );
  }
}

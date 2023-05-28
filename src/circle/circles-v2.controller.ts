import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { CircleAuthGuard, ViewCircleAuthGuard } from 'src/auth/circle.guard';
import { PublicViewAuthGuard } from 'src/auth/iron-session.guard';
import { RequiredSlugDto } from 'src/common/dtos/string.dto';
import { EntitiesInCircleResponseDto } from './dto/v2/circle-response.dto';
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
  async findBySlug(
    @Param() param: RequiredSlugDto,
  ): Promise<EntitiesInCircleResponseDto> {
    return await this.queryBus.execute(
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
  }
}

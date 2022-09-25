import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { RequiredSlugDto } from 'src/common/dtos/string.dto';
import { CreateCollectionCommand, UpdateCollectionCommand } from './commands';
import { CreateCollectionDto } from './dto/create-collection-request.dto';
import { UpdateCollectionDto } from './dto/update-collection-request.dto';
import { Collection } from './model/collection.model';
import { GetCollectionBySlugQuery } from './queries/impl/get-collection.query';

@Controller('collection/v1')
export class CollectionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('/slug/:slug')
  async findBySlug(@Param() param: RequiredSlugDto): Promise<Collection> {
    return await this.queryBus.execute(
      new GetCollectionBySlugQuery(param.slug),
    );
  }

  @Get('/:id')
  async findByObjectId(@Param() param: ObjectIdDto): Promise<Collection> {
    return await this.queryBus.execute(new GetCollectionBySlugQuery(param.id));
  }

  @UseGuards(SessionAuthGuard)
  @Post('/')
  async create(
    @Body() createCollectionDto: CreateCollectionDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new CreateCollectionCommand(createCollectionDto, req.user.id),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id')
  async update(
    @Param() param: ObjectIdDto,
    @Body() updateCollectionDto: UpdateCollectionDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new UpdateCollectionCommand(updateCollectionDto, req.user.id, param.id),
    );
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import {
  RequiredPropertyIdDto,
  RequiredSlugDto,
  RequiredUUIDDto,
} from 'src/common/dtos/string.dto';
import {
  AddPropertyCommand,
  CreateCollectionCommand,
  RemovePropertyCommand,
  UpdateCollectionCommand,
  UpdatePropertyCommand,
} from './commands';
import { AddDataCommand } from './commands/data/impl/add-data.command';
import { RemoveDataCommand } from './commands/data/impl/remove-data.command';
import { UpdateDataCommand } from './commands/data/impl/update-data.command';
import { CreateCollectionDto } from './dto/create-collection-request.dto';
import { UpdateCollectionDto } from './dto/update-collection-request.dto';
import { AddDataDto, UpdateDataDto } from './dto/update-data-request.dto';
import {
  AddPropertyDto,
  UpdatePropertyDto,
} from './dto/update-property-request.dto';
import { Collection } from './model/collection.model';
import { GetCollectionBySlugQuery } from './queries/impl/get-collection.query';
import { CrudService } from './services/crud.service';

@Controller('collection/v1')
export class CollectionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly crudService: CrudService,
  ) {}

  @Get('/slug/:slug')
  async findBySlug(@Param() param: RequiredSlugDto): Promise<Collection> {
    return await this.crudService.getCollectionBySlug(param.slug);
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

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/addProperty')
  async addProperty(
    @Param() param: ObjectIdDto,
    @Body() addPropertyDto: AddPropertyDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new AddPropertyCommand(addPropertyDto, req.user.id, param.id),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/updateProperty')
  async updateProperty(
    @Param() param: ObjectIdDto,
    @Query() propertyParam: RequiredPropertyIdDto,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new UpdatePropertyCommand(
        updatePropertyDto,
        req.user.id,
        param.id,
        propertyParam.propertyId,
      ),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/removeProperty')
  async removeProperty(
    @Param() param: ObjectIdDto,
    @Query() propertyParam: RequiredPropertyIdDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new RemovePropertyCommand(
        req.user.id,
        param.id,
        propertyParam.propertyId,
      ),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/addData')
  async addData(
    @Param() param: ObjectIdDto,
    @Body() addDataDto: AddDataDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new AddDataCommand(addDataDto.data, req.user, param.id),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/updateData')
  async updateData(
    @Param() param: ObjectIdDto,
    @Query() dataIdParam: RequiredUUIDDto,
    @Body() updateDataDto: UpdateDataDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new UpdateDataCommand(
        updateDataDto.data,
        req.user,
        param.id,
        dataIdParam.id,
      ),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/removeData')
  async removeData(
    @Param() param: ObjectIdDto,
    @Query() dataIdParam: RequiredUUIDDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new RemoveDataCommand(req.user, param.id, dataIdParam.id),
    );
  }
}

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
import {
  PublicViewAuthGuard,
  SessionAuthGuard,
} from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import {
  RequiredActivityUUIDDto,
  RequiredPropertyIdDto,
  RequiredSlugDto,
  RequiredUUIDDto,
} from 'src/common/dtos/string.dto';
import { MintKudosService } from 'src/common/mint-kudos.service';
import {
  AddCommentCommand,
  AddPropertyCommand,
  CreateCollectionCommand,
  RemoveCommentCommand,
  RemovePropertyCommand,
  UpdateCollectionCommand,
  UpdateCommentCommand,
  UpdatePropertyCommand,
} from './commands';
import { AddDataCommand } from './commands/data/impl/add-data.command';
import { RemoveDataCommand } from './commands/data/impl/remove-data.command';
import { UpdateDataCommand } from './commands/data/impl/update-data.command';
import { CollectionResponseDto } from './dto/collection-response.dto';
import { CreateCollectionDto } from './dto/create-collection-request.dto';
import { UpdateCollectionDto } from './dto/update-collection-request.dto';
import {
  AddCommentDto,
  UpdateCommentDto,
} from './dto/update-comments-request.dto';
import { AddDataDto, UpdateDataDto } from './dto/update-data-request.dto';
import {
  AddPropertyDto,
  UpdatePropertyDto,
} from './dto/update-property-request.dto';
import { Collection } from './model/collection.model';
import {
  GetCollectionByIdQuery,
  GetCollectionBySlugQuery,
} from './queries/impl/get-collection.query';
import { CrudService } from './services/crud.service';

@Controller('collection/v1')
export class CollectionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly crudService: CrudService,
    private readonly kudosService: MintKudosService,
  ) {}

  @UseGuards(PublicViewAuthGuard)
  @Get('/slug/:slug')
  async findBySlug(
    @Param() param: RequiredSlugDto,
  ): Promise<CollectionResponseDto> {
    return await this.crudService.getCollectionBySlug(param.slug);
  }

  @UseGuards(PublicViewAuthGuard)
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
      new UpdateCollectionCommand(updateCollectionDto, req.user?.id, param.id),
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
      new AddPropertyCommand(addPropertyDto, req.user?.id, param.id),
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
        req.user?.id,
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

  @UseGuards(PublicViewAuthGuard)
  @Patch('/:id/addData')
  async addDataInForm(
    @Param() param: ObjectIdDto,
    @Body() addDataDto: AddDataDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new AddDataCommand(addDataDto.data, req.user, param.id, true),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/addDataGuarded')
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
        dataIdParam.dataId,
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
      new RemoveDataCommand(req.user, param.id, dataIdParam.dataId),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/addComment')
  async addComment(
    @Param() param: ObjectIdDto,
    @Query() dataIdParam: RequiredUUIDDto,
    @Body() addCommentDto: AddCommentDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new AddCommentCommand(
        param.id,
        dataIdParam.dataId,
        addCommentDto.content,
        addCommentDto.ref,
        req.user,
      ),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/updateComment')
  async updateComment(
    @Param() param: ObjectIdDto,
    @Query() dataIdParam: RequiredUUIDDto,
    @Query() activityIdParam: RequiredActivityUUIDDto,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new UpdateCommentCommand(
        param.id,
        dataIdParam.dataId,
        activityIdParam.activityId,
        updateCommentDto.content,
        updateCommentDto.ref,
        req.user,
      ),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/removeComment')
  async removeComment(
    @Param() param: ObjectIdDto,
    @Query() dataIdParam: RequiredUUIDDto,
    @Query() activityIdParam: RequiredActivityUUIDDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new RemoveCommentCommand(
        param.id,
        dataIdParam.dataId,
        activityIdParam.activityId,
        req.user,
      ),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/airdropKudos')
  async airdropKudos(
    @Param() param: ObjectIdDto,
    @Request() req,
  ): Promise<object> {
    const collection = await this.queryBus.execute(
      new GetCollectionByIdQuery(param.id),
    );
    console.log(collection);
    return await this.kudosService.airdropKudos(
      collection?.parents[0].id,
      collection.mintkudosTokenId,
      req.user.ethAddress,
    );
  }
}

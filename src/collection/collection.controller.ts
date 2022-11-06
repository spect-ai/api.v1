import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CollectionAuthGuard,
  CreateNewCollectionAuthGuard,
  ViewCollectionAuthGuard,
} from 'src/auth/collection.guard';
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
import {
  RemoveDataCommand,
  RemoveMultipleDataCommand,
} from './commands/data/impl/remove-data.command';
import { UpdateDataCommand } from './commands/data/impl/update-data.command';
import { VoteDataCommand } from './commands/data/impl/vote-data.command';
import {
  CollectionPublicResponseDto,
  CollectionResponseDto,
} from './dto/collection-response.dto';
import { CreateCollectionDto } from './dto/create-collection-request.dto';
import { RemoveDataDto } from './dto/remove.data-request.dto';
import { UpdateCollectionDto } from './dto/update-collection-request.dto';
import {
  AddCommentDto,
  UpdateCommentDto,
} from './dto/update-comments-request.dto';
import {
  AddDataDto,
  UpdateDataDto,
  VoteDataDto,
} from './dto/update-data-request.dto';
import {
  AddPropertyDto,
  UpdatePropertyDto,
} from './dto/update-property-request.dto';
import { Collection } from './model/collection.model';
import {
  GetPrivateViewCollectionQuery,
  GetPublicViewCollectionQuery,
} from './queries/impl/get-collection.query';
import { ResponseCredentialingService } from './services/response-credentialing.service';

@Controller('collection/v1')
export class CollectionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly credentialingService: ResponseCredentialingService,
  ) {}

  @UseGuards(ViewCollectionAuthGuard)
  @Get('/slug/:slug')
  async findBySlug(
    @Param() param: RequiredSlugDto,
  ): Promise<CollectionResponseDto> {
    return await this.queryBus.execute(
      new GetPrivateViewCollectionQuery(param.slug),
    );
  }

  @UseGuards(PublicViewAuthGuard)
  @Get('/public/slug/:slug')
  async findBySlugPublic(
    @Param() param: RequiredSlugDto,
    @Request() req,
  ): Promise<CollectionPublicResponseDto> {
    return await this.queryBus.execute(
      new GetPublicViewCollectionQuery(req.user, param.slug),
    );
  }

  @UseGuards(CreateNewCollectionAuthGuard)
  @Post('/')
  async create(
    @Body() createCollectionDto: CreateCollectionDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new CreateCollectionCommand(createCollectionDto, req.user.id),
    );
  }

  @SetMetadata('permissions', ['manageFormSettings'])
  @UseGuards(CollectionAuthGuard)
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

  @SetMetadata('permissions', ['manageFormSettings'])
  @UseGuards(CollectionAuthGuard)
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

  @SetMetadata('permissions', ['manageFormSettings'])
  @UseGuards(CollectionAuthGuard)
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

  @SetMetadata('permissions', ['manageFormSettings'])
  @UseGuards(CollectionAuthGuard)
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

  @SetMetadata('permissions', ['updateFormResponsesManually'])
  @UseGuards(CollectionAuthGuard)
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
        'public',
      ),
    );
  }

  @SetMetadata('permissions', ['updateFormResponsesManually'])
  @UseGuards(CollectionAuthGuard)
  @Patch('/:id/updateDataGuarded')
  async updateDataGuarded(
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
        'private',
      ),
    );
  }

  @SetMetadata('permissions', ['updateFormResponsesManually'])
  @UseGuards(CollectionAuthGuard)
  @Patch('/:id/removeMultipleData')
  async removeMultipleData(
    @Param() param: ObjectIdDto,
    @Body() removeDataDto: RemoveDataDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new RemoveMultipleDataCommand(req.user, param.id, removeDataDto.dataIds),
    );
  }

  @SetMetadata('permissions', ['updateFormResponsesManually'])
  @UseGuards(CollectionAuthGuard)
  @Patch('/:id/removeDataGuarded')
  async removeDataGuarded(
    @Param() param: ObjectIdDto,
    @Query() dataIdParam: RequiredUUIDDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new RemoveDataCommand(req.user, param.id, dataIdParam.dataId),
    );
  }

  @SetMetadata('permissions', ['updateFormResponsesManually'])
  @UseGuards(CollectionAuthGuard)
  @Patch('/:id/removeMultipleDataGuarded')
  async removeMultipleDataGuarded(
    @Param() param: ObjectIdDto,
    @Body() removeDataDto: RemoveDataDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new RemoveMultipleDataCommand(req.user, param.id, removeDataDto.dataIds),
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
  async airdropKudos(@Param() param: ObjectIdDto): Promise<object> {
    return await this.credentialingService.airdropMintkudosToken(param.id);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/voteOnData')
  async voteOnData(
    @Param() param: ObjectIdDto,
    @Query() dataIdParam: RequiredUUIDDto,
    @Body() voteDataDto: VoteDataDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new VoteDataCommand(
        dataIdParam.dataId,
        req.user,
        param.id,
        voteDataDto.vote,
      ),
    );
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import {
  CollectionAuthGuard,
  CreateNewCollectionAuthGuard,
  ViewCollectionAuthGuard,
} from 'src/auth/collection.guard';
import {
  AdminAuthGuard,
  PublicViewAuthGuard,
  SessionAuthGuard,
} from 'src/auth/iron-session.guard';
import { Circle } from 'src/circle/model/circle.model';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import {
  RequiredActivityUUIDDto,
  RequiredPropertyIdDto,
  RequiredSlugDto,
  RequiredUUIDDto,
} from 'src/common/dtos/string.dto';
import { MappedItem } from 'src/common/interfaces';
import { CreatePOAPDto } from 'src/credentials/dto/create-credential.dto';
import {
  AddCommentCommand,
  AddPropertyCommand,
  CreateCollectionCommand,
  DeleteCollectionCommand,
  ImportCommand,
  MigrateAllCollectionsCommand,
  MigrateProjectCommand,
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
import {
  EndVotingPeriodCommand,
  RecordSnapshotProposalCommand,
  StartVotingPeriodCommand,
  VoteDataCommand,
} from './commands/data/impl/vote-data.command';
import { OnboardToSpectProjectCommand } from './commands/default/impl';
import {
  CreateGrantWorkflowCommand,
  KanbanProjectCommand,
  OnboardingWorkflowCommand,
} from './commands/template/impl';
import {
  CollectionPublicResponseDto,
  CollectionResponseDto,
} from './dto/collection-response.dto';
import {
  CreateCollectionDto,
  MigrateCollectionDto,
} from './dto/create-collection-request.dto';
import { CreateCollectionResponseDto } from './dto/create-collection-response.dto';
import {
  TemplateIdDto,
  UseTemplateDto,
} from './dto/grant-workflow-template.dto';
import { LinkDiscordDto } from './dto/link-discord.dto';
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
import {
  SnapshotProposalDto,
  StartVotingPeriodRequestDto,
} from './dto/voting.dto';
import { Collection } from './model/collection.model';
import {
  GetCollectionByIdQuery,
  GetPrivateViewCollectionQuery,
  GetPublicViewCollectionQuery,
} from './queries/impl/get-collection.query';
import { LinkDiscordService } from './services/link-discord.service';
import { ResponseCredentialingService } from './services/response-credentialing.service';
import { WhitelistService } from './services/whitelist.service';
import { Property } from './types/types';

@Controller('collection/v1')
@ApiTags('collection.v1')
export class CollectionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly credentialingService: ResponseCredentialingService,
    private readonly whitelistService: WhitelistService,
    private readonly linkDiscordService: LinkDiscordService,
  ) {}

  @UseGuards(SessionAuthGuard)
  @Get('/isWhitelisted')
  async isWhitelisted(
    @Query()
    query: {
      for: string;
    },
    @Request() req,
  ): Promise<boolean> {
    return await this.whitelistService.isWhitelisted(query.for, req.user);
  }

  @UseGuards(ViewCollectionAuthGuard)
  @Get('/:id')
  async findById(@Param() param: ObjectIdDto): Promise<CollectionResponseDto> {
    return await this.queryBus.execute(new GetCollectionByIdQuery(param.id));
  }

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
  ): Promise<CreateCollectionResponseDto> {
    return await this.commandBus.execute(
      new CreateCollectionCommand(createCollectionDto, req.user.id),
    );
  }

  @UseGuards(CreateNewCollectionAuthGuard)
  @Post('/migrateFromProject')
  async migrateProject(
    @Body() migrateollectionDto: MigrateCollectionDto,
    @Request() req,
  ): Promise<CreateCollectionResponseDto> {
    return await this.commandBus.execute(
      new MigrateProjectCommand(migrateollectionDto.projectId, req.user.id),
    );
  }

  @UseGuards(AdminAuthGuard)
  @Patch('/migrateAllCollections')
  async migrateCollection(
    @Request() req,
  ): Promise<CreateCollectionResponseDto> {
    return await this.commandBus.execute(
      new MigrateAllCollectionsCommand(req.user.id),
    );
  }

  @SetMetadata('permissions', ['manageSettings'])
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

  @SetMetadata('permissions', ['manageSettings'])
  @UseGuards(CollectionAuthGuard)
  @Delete('/:id')
  async delete(
    @Param() param: ObjectIdDto,
    @Body() updateCollectionDto: UpdateCollectionDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new DeleteCollectionCommand(param.id, req.user?.id),
    );
  }

  @SetMetadata('permissions', ['manageSettings'])
  @UseGuards(CollectionAuthGuard)
  @Patch('/:id/addProperty')
  async addProperty(
    @Param() param: ObjectIdDto,
    @Body() addPropertyDto: AddPropertyDto,
    @Query() query: { pageId?: string },
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new AddPropertyCommand(
        addPropertyDto,
        req.user?.id,
        param.id,
        query.pageId,
      ),
    );
  }

  @SetMetadata('permissions', ['manageSettings'])
  @UseGuards(CollectionAuthGuard)
  @Patch('/:id/updateProperty')
  async updateProperty(
    @Param() param: ObjectIdDto,
    // @Query() propertyParam: RequiredPropertyIdDto,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new UpdatePropertyCommand(
        updatePropertyDto,
        req.user?.id,
        param.id,
        updatePropertyDto.propertyId,
      ),
    );
  }

  @SetMetadata('permissions', ['manageSettings'])
  @UseGuards(CollectionAuthGuard)
  @Patch('/:id/removeProperty')
  async removeProperty(
    @Param() param: ObjectIdDto,
    @Body() propertyParam: RequiredPropertyIdDto,
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
      new AddDataCommand(
        addDataDto.data,
        req.user,
        param.id,
        addDataDto.anon,
        true,
      ),
    );
  }

  @SetMetadata('permissions', ['updateResponsesManually'])
  @UseGuards(CollectionAuthGuard)
  @Patch('/:id/addDataGuarded')
  async addData(
    @Param() param: ObjectIdDto,
    @Body() addDataDto: AddDataDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new AddDataCommand(addDataDto.data, req.user, param.id, false),
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

  @SetMetadata('permissions', ['updateResponsesManually'])
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

  @SetMetadata('permissions', ['updateResponsesManually'])
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

  @SetMetadata('permissions', ['updateResponsesManually'])
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

  @SetMetadata('permissions', ['updateResponsesManually'])
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
  @Patch('/:id/addCommentPublic')
  async addCommentPublic(
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
        true,
      ),
    );
  }

  @UseGuards(CollectionAuthGuard)
  @Patch('/:id/updateCommentPublic')
  async updateCommentPublic(
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

  @UseGuards(CollectionAuthGuard)
  @Patch('/:id/removeCommentPublic')
  async removeCommentPublic(
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
  @Patch('/:id/snapshotProposal')
  async recordSnapshotProposal(
    @Param() param: ObjectIdDto,
    @Query() dataIdParam: RequiredUUIDDto,
    @Body() snapshotProposalDto: SnapshotProposalDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new RecordSnapshotProposalCommand(
        param.id,
        dataIdParam.dataId,
        snapshotProposalDto,
        req.user,
      ),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/startVotingPeriod')
  async startVotingPeriod(
    @Param() param: ObjectIdDto,
    @Query() dataIdParam: RequiredUUIDDto,
    @Body() startVotingPeriodRequestDto: StartVotingPeriodRequestDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new StartVotingPeriodCommand(
        dataIdParam.dataId,
        param.id,
        req.user,
        startVotingPeriodRequestDto,
      ),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/endVotingPeriod')
  async endVotingPeriod(
    @Param() param: ObjectIdDto,
    @Query() dataIdParam: RequiredUUIDDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new EndVotingPeriodCommand(dataIdParam.dataId, req.user, param.id),
    );
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

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(SessionAuthGuard)
  @Patch('/:id/useTemplate')
  async useTemplate(
    @Param() param: ObjectIdDto,
    @Body() template: UseTemplateDto,
    @Query() query: TemplateIdDto,
    @Request() req,
  ): Promise<Circle> {
    if (query.templateId === '1') {
      return await this.commandBus.execute(
        new CreateGrantWorkflowCommand(template, param.id, req.user?.id),
      );
    } else if (query.templateId === '2') {
      return await this.commandBus.execute(
        new OnboardingWorkflowCommand(template, param.id, req.user?.id),
      );
    } else if (query.templateId === '3') {
      return await this.commandBus.execute(
        new KanbanProjectCommand(template, param.id, req.user?.id),
      );
    }
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(SessionAuthGuard)
  @Patch('/:id/defaultProject')
  async useDefault(
    @Param() param: ObjectIdDto,
    @Request() req,
  ): Promise<Circle> {
    return await this.commandBus.execute(
      new OnboardToSpectProjectCommand(param.id, req.user?.id),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(SessionAuthGuard)
  @Post('/importfromcsv')
  async importfromCsv(
    @Body()
    body: {
      data: object[];
      collectionId: string;
      collectionProperties: MappedItem<Property>;
      groupByColumn: string;
      circleId: string;
    },
    @Request() req,
  ): Promise<Circle> {
    return await this.commandBus.execute(
      new ImportCommand(
        body.data,
        body.collectionId,
        body.collectionProperties,
        body.groupByColumn,
        body.circleId,
        req.user?.id,
      ),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/claimSurveyTokens')
  async claimSurveyTokens(@Param() param: ObjectIdDto): Promise<{
    transactionHash: string;
  }> {
    return await this.credentialingService.airdropSurveyToken(param.id);
  }

  @UseGuards(AdminAuthGuard)
  @Patch('/:id/createPoap')
  @UseInterceptors(FileInterceptor('file'))
  async createPoap(
    @Param() param: ObjectIdDto,
    @Body() body: CreatePOAPDto,
    @UploadedFile() file,
  ): Promise<boolean> {
    return await this.credentialingService.createPoap(param.id, body, file);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/claimPoap')
  async claimPoap(@Param() param: ObjectIdDto): Promise<boolean> {
    return await this.credentialingService.claimPoap(param.id);
  }

  @SetMetadata('permissions', ['manageSettings'])
  @UseGuards(CollectionAuthGuard)
  @Patch('/:id/linkDiscord')
  async linkDiscord(
    @Param() param: ObjectIdDto,
    @Body() body: LinkDiscordDto,
    @Query() query: RequiredUUIDDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.linkDiscordService.linkThread(
      param.id,
      query.dataId,
      body,
      req.user,
    );
  }
}

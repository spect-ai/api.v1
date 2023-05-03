import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
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
  FrontendServerGuard,
  PublicViewAuthGuard,
  SessionAuthGuard,
} from 'src/auth/iron-session.guard';
import { Circle } from 'src/circle/model/circle.model';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import {
  RequiredActivityUUIDDto,
  RequiredDiscordChannelIdDto,
  RequiredDiscordIdDto,
  RequiredDiscordMessageIdDto,
  RequiredPropertyIdDto,
  RequiredSlugDto,
  RequiredUUIDDto,
} from 'src/common/dtos/string.dto';
import { MappedItem } from 'src/common/interfaces';
import { CreatePOAPDto } from 'src/credentials/dto/create-credential.dto';
import { KudosResponseDto } from 'src/credentials/dto/mint-kudos.dto';
import {
  AddCommentCommand,
  AddPropertyCommand,
  CreateCollectionCommand,
  DeleteCollectionCommand,
  GetChangelogCommand,
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
import {
  SaveAndPostPaymentCommand,
  SaveAndPostSocialsCommand,
  SaveDraftFromDiscordCommand,
} from './commands/data/impl/save-draft.command';
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
import { FormPaymentDto } from './dto/form-payment.dto';
import {
  TemplateIdDto,
  UseTemplateDto,
} from './dto/grant-workflow-template.dto';
import {
  LinkDiscordDto,
  LinkDiscordToCollectionDto,
  LinkDiscordThreadToDataDto,
  NextFieldRequestDto,
} from './dto/link-discord.dto';
import { RemoveDataDto } from './dto/remove.data-request.dto';
import { SocialsDto } from './dto/socials.dto';
import { UpdateCollectionDto } from './dto/update-collection-request.dto';
import {
  AddCommentDto,
  UpdateCommentDto,
} from './dto/update-comments-request.dto';
import {
  AddDataDto,
  SaveDraftDto,
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
import { GetFormAnalyticsBySlugQuery, GetNextFieldQuery } from './queries';
import {
  GetCollectionByFilterQuery,
  GetCollectionByIdQuery,
  GetPrivateViewCollectionQuery,
  GetPublicViewCollectionQuery,
} from './queries/impl/get-collection.query';
import { GetCollectionService } from './services/get-collection.service';
import { LinkDiscordService } from './services/link-discord.service';
import { ResponseCredentialingService } from './services/response-credentialing.service';
import { WhitelistService } from './services/whitelist.service';
import { Property } from './types/types';
import { BotAuthGuard } from 'src/auth/bot.guard';
import { DeleteDraftCommand } from './commands/data/impl/delete-draft.command';
import { AdvancedAccessService } from './services/advanced-access.service';

@Controller('collection/v1')
@ApiTags('collection.v1')
export class CollectionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly credentialingService: ResponseCredentialingService,
    private readonly whitelistService: WhitelistService,
    private readonly linkDiscordService: LinkDiscordService,
    private readonly getCollectionService: GetCollectionService,
    private readonly advancedAccessService: AdvancedAccessService,
  ) {}

  @Get('/changelog')
  async getChangelog(): Promise<CreateCollectionResponseDto> {
    return await this.commandBus.execute(new GetChangelogCommand());
  }

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
        updatePropertyDto.id,
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
    @Query('verificationToken') verificationToken: string,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new AddDataCommand(
        addDataDto.data,
        req.user,
        param.id,
        addDataDto.anon,
        true,
        true,
        true,
        null,
        verificationToken,
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
  async airdropKudos(
    @Param() param: ObjectIdDto,
  ): Promise<{ operationId: string }> {
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
    return await this.linkDiscordService.createAndlinkThread(
      param.id,
      query.dataId,
      body,
      req.user,
    );
  }

  @UseGuards(FrontendServerGuard)
  @Get('/:slug/embedCharts')
  async getEmbedCharts(@Param() param: RequiredSlugDto): Promise<Collection> {
    return await this.queryBus.execute(
      new GetFormAnalyticsBySlugQuery(param.slug),
    );
  }

  @SetMetadata('permissions', ['manageSettings'])
  @UseGuards(CollectionAuthGuard)
  @Patch('/:id/linkDiscordThreadToCollection')
  async linkDiscordThreadToCollection(
    @Param() param: ObjectIdDto,
    @Body() body: LinkDiscordToCollectionDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.linkDiscordService.linkThreadToCollection(
      param.id,
      body,
      req.user,
    );
  }

  @UseGuards(PublicViewAuthGuard)
  @Patch('/:messageId/linkDiscordThreadToCollectionData')
  async linkDiscordThreadToCollectionData(
    @Param() param: RequiredDiscordMessageIdDto,
    @Query() query: RequiredDiscordIdDto,
    @Body() body: LinkDiscordThreadToDataDto,
    @Request() req,
  ): Promise<{
    success: boolean;
  }> {
    return await this.linkDiscordService.linkThreadToData(
      param.messageId,
      query.discordId,
      body,
    );
  }

  @SetMetadata('permissions', ['manageSettings'])
  @UseGuards(CollectionAuthGuard)
  @Patch('/:id/postFormMessage')
  async postFormMessage(
    @Param() param: ObjectIdDto,
    @Body() body: RequiredDiscordChannelIdDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.linkDiscordService.postForm(
      param.id,
      body.channelId,
      req.user,
    );
  }

  @UseGuards(BotAuthGuard)
  @Patch('/:channelId/saveDraft')
  async saveDraft(
    @Param() param: RequiredDiscordChannelIdDto,
    @Query() query: RequiredDiscordIdDto,
    @Body()
    body: SaveDraftDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new SaveDraftFromDiscordCommand(
        body.data,
        query.discordId,
        param.channelId,
        body.skip,
      ),
    );
  }

  @UseGuards(BotAuthGuard)
  @Patch('/:channelId/deleteDraft')
  async deleteDraft(
    @Param() param: RequiredDiscordChannelIdDto,
    @Query() query: RequiredDiscordIdDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new DeleteDraftCommand(query.discordId, param.channelId),
    );
  }

  @UseGuards(BotAuthGuard)
  @Get('/:channelId/nextField')
  async nextField(
    @Param() param: RequiredDiscordChannelIdDto,
    @Query() query: RequiredDiscordIdDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.queryBus.execute(
      new GetNextFieldQuery(
        query.discordId,
        'discordId',
        null,
        param.channelId,
        null,
        query.populateFields === 'true' ? true : false,
      ),
    );
  }

  @UseGuards(BotAuthGuard)
  @Get('/:channelId/firstField')
  async firstField(
    @Param() param: RequiredDiscordChannelIdDto,
    @Query() query: RequiredDiscordIdDto,
    @Request() req,
  ): Promise<{
    field: Property;
    formName: string;
    active: boolean;
  }> {
    console.log({ param, query });
    const collection = await this.queryBus.execute(
      new GetCollectionByFilterQuery({
        'collectionLevelDiscordThreadRef.messageId': param.channelId,
      }),
    );
    if (!collection) throw new NotFoundException('Collection not found');
    return {
      field: await this.queryBus.execute(
        new GetNextFieldQuery(
          query.discordId,
          'discordId',
          null,
          null,
          collection,
          query.populateFields === 'true' ? true : false,
        ),
      ),
      formName: collection.name,
      active: collection.formMetadata.active,
    };
  }

  @UseGuards(PublicViewAuthGuard)
  @Patch('/:channelId/saveAndPostSocials')
  async saveAndPostSocials(
    @Param() param: RequiredDiscordChannelIdDto,
    @Body() body: SocialsDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new SaveAndPostSocialsCommand(body, param.channelId, req.user),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:channelId/saveAndPostPayment')
  async saveAndPostPayment(
    @Param() param: RequiredDiscordChannelIdDto,
    @Body() body: FormPaymentDto,
    @Query() query: RequiredDiscordIdDto,
    @Request() req,
  ): Promise<Collection> {
    return await this.commandBus.execute(
      new SaveAndPostPaymentCommand(
        body,
        param.channelId,
        query.discordId,
        req.user,
      ),
    );
  }

  @UseGuards(BotAuthGuard)
  @Patch('/:channelId/claimPoapFromBot')
  async claimPoapFromBot(
    @Param() param: RequiredDiscordChannelIdDto,
    @Query() query: RequiredDiscordIdDto,
  ): Promise<Collection> {
    console.log({ param, query });
    return await this.credentialingService.claimPoapFromBot(
      query.discordId,
      param.channelId,
    );
  }

  @UseGuards(BotAuthGuard)
  @Patch('/:channelId/claimKudosFromBot')
  async claimKudosFromBot(
    @Param() param: RequiredDiscordChannelIdDto,
    @Query() query: RequiredDiscordIdDto,
  ): Promise<{ operationId: string }> {
    return await this.credentialingService.claimKudosFromBot(
      query.discordId,
      param.channelId,
    );
  }

  @UseGuards(BotAuthGuard)
  @Patch('/:channelId/claimERC20FromBot')
  async claimERC20FromBot(
    @Param() param: RequiredDiscordChannelIdDto,
    @Query() query: RequiredDiscordIdDto,
  ): Promise<{ transactionHash: string }> {
    return await this.credentialingService.claimERC20FromBot(
      query.discordId,
      param.channelId,
    );
  }

  // TODO: Protect this
  @UseGuards(PublicViewAuthGuard)
  @Get('/:channelId/collection')
  async getCollectionByChannelId(
    @Param() param: RequiredDiscordChannelIdDto,
  ): Promise<Collection> {
    return await this.getCollectionService.getCollectionFromAnyId(
      null,
      null,
      param.channelId,
      {
        parents: {
          slug: 1,
          name: 1,
          id: 1,
          _id: 1,
        },
      },
    );
  }

  @UseGuards(PublicViewAuthGuard)
  @Post('/:id/verifyAccess')
  async verifyAccess(
    @Param() param: ObjectIdDto,
    @Query('code') code: string,
  ): Promise<{
    verificationToken?: string;
    disordUser?: {
      id: string;
      username: string;
      discriminator: string;
      avatar: string;
    };
  }> {
    return await this.advancedAccessService.generateAccessConfirmationTokenForDiscordRoleGatedForms(
      param.id,
      code,
    );
  }
}

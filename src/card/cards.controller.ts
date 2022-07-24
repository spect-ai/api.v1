import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  ConnectedGithubAuthGuard,
  PublicViewAuthGuard,
  SessionAuthGuard,
} from 'src/auth/iron-session.guard';
import { CardAuthGuard, CreateNewCardAuthGuard } from 'src/auth/card.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import {
  GetByProjectAndSlugDto,
  GetByProjectSlugAndCardSlugDto,
} from './dto/get-card-params.dto';
import {
  MultiCardCloseDto,
  MultiCardCloseWithSlugDto,
  UpdateCardRequestDto,
  UpdateCardStatusRequestDto,
} from './dto/update-card-request.dto';
import {
  UpdateWorkUnitRequestDto,
  CreateWorkThreadRequestDto,
  UpdateWorkThreadRequestDto,
  CreateWorkUnitRequestDto,
  CreateGithubPRDto,
} from './dto/work-request.dto';
import { AddCommentDto, UpdateCommentDto } from './dto/comment-body.dto';
import {
  MultipleValidCardActionResponseDto,
  ValidCardActionResponseDto,
} from './dto/card-access-response.dto';
import { AggregatedFlattenedPaymentInfo } from './dto/payment-info-response.dto';
import { UpdatePaymentInfoDto } from './dto/update-payment-info.dto';
import {
  CreateApplicationDto,
  PickApplicationDto,
  UpdateApplicationDto,
} from './dto/application.dto';
import { UpdateApplicationParamDto } from './dto/param.dto';
import { CardsService } from './cards.service';
import { ApplicationService } from './application.cards.service';
import { ActionService } from './actions.service';
import { WorkService } from './work.cards.service';
import { CommentService } from './comments.cards.service';
import { CardsPaymentService } from './payment.cards.service';
import { CardCommandHandler } from './handlers/update.command.handler';
import { WorkCommandHandler } from './handlers/work.command.handler';
import {
  RequiredCommitIdDto,
  RequiredSlugDto,
  RequiredThreadIdDto,
  RequiredWorkUnitIdDto,
} from 'src/common/dtos/string.dto';
import { CreateCardCommandHandler } from './handlers/create.command.handler';

@Controller('card')
@ApiTags('card')
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly actionService: ActionService,
    private readonly applicationService: ApplicationService,
    private readonly commentService: CommentService,
    private readonly paymentService: CardsPaymentService,
    private readonly cardCommandHandler: CardCommandHandler,
    private readonly workCommandHandler: WorkCommandHandler,
    private readonly createCommandHandler: CreateCardCommandHandler,
  ) {}

  @UseGuards(PublicViewAuthGuard)
  @Get('/byProjectSlugAndCardSlug/:projectSlug/:cardSlug')
  async findByProjectSlugAndCardSlug(
    @Param() params: GetByProjectSlugAndCardSlugDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.getDetailedCardByProjectSlugAndCardSlug(
      params.projectSlug,
      params.cardSlug,
    );
  }

  @UseGuards(PublicViewAuthGuard)
  @Get('/byProjectAndSlug/:project/:slug')
  async findByProjectIdAndCardSlug(
    @Param() params: GetByProjectAndSlugDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.getDetailedCardByProjectIdAndCardSlug(
      params.project,
      params.slug,
    );
  }

  @Get('/aggregatedPaymentInfo')
  @ApiQuery({ name: 'cardIds', type: 'array' })
  @ApiQuery({ name: 'chainId', type: 'string' })
  async getAggregatedPaymentInfo(
    @Query('cardIds') cardIds: string[],
    @Query('chainId') chainId: string,
  ): Promise<AggregatedFlattenedPaymentInfo> {
    console.log(cardIds);
    return await this.paymentService.aggregatePaymentInfo(cardIds, chainId);
  }

  //@SetMetadata('permissions', ['makePayment'])
  @UseGuards(SessionAuthGuard)
  @Patch('/updatePaymentInfoAndClose')
  async updatePaymentInfoAndClose(
    @Body() updatePaymentInfoDto: UpdatePaymentInfoDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.cardCommandHandler.updatePaymentInfoAndClose(
      updatePaymentInfoDto,
    );
  }

  @UseGuards(PublicViewAuthGuard)
  @Patch('/closeWithBot')
  async closeWithBot(
    @Body() multiCardCloseDto: MultiCardCloseWithSlugDto,
  ): Promise<boolean> {
    return await this.cardCommandHandler.closeMultipleCards(multiCardCloseDto);
  }

  @ApiQuery({ name: 'cardIds', type: 'string' })
  @UseGuards(SessionAuthGuard)
  @Get('/myValidActions')
  async getValidActionsForMultipleCards(
    @Query('cardIds') cardIds: string,
  ): Promise<MultipleValidCardActionResponseDto> {
    return await this.actionService.getValidActionsForMultipleCards(
      cardIds.split(',').map((c) => c.trim()),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get('/myValidActionsInProject/:slug')
  async getValidActionsWithProjectSlug(
    @Param() params: RequiredSlugDto,
  ): Promise<MultipleValidCardActionResponseDto> {
    return await this.actionService.getValidActionsWithProjectSlug(params.slug);
  }

  @UseGuards(SessionAuthGuard)
  @Get('/myValidActionsInCard/:projectSlug/:cardSlug')
  async getValidActionsWithCardAndProjectSlug(
    @Param() params: GetByProjectSlugAndCardSlugDto,
  ): Promise<ValidCardActionResponseDto> {
    return await this.actionService.getValidActionsWithCardAndProjectSlug(
      params.projectSlug,
      params.cardSlug,
    );
  }

  @Get('/:id')
  async findByObjectId(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.getDetailedCard(params.id);
  }

  @ApiParam({ name: 'id', type: 'string' })
  @UseGuards(SessionAuthGuard)
  @Get('/:id/myValidActions')
  async getValidActions(
    @Param() params: ObjectIdDto,
  ): Promise<ValidCardActionResponseDto> {
    return await this.actionService.getValidActions(params.id);
  }

  @Post('/')
  @UseGuards(CreateNewCardAuthGuard)
  async create(@Body() card: CreateCardRequestDto): Promise<{
    card: DetailedCardResponseDto;
  }> {
    return await this.createCommandHandler.handle(card);
  }

  @Patch('/createWorkThreadWithPR')
  @UseGuards(PublicViewAuthGuard)
  async createWorkThreadWithPR(
    @Body() createGithubPRDto: CreateGithubPRDto,
  ): Promise<boolean> {
    console.log(createGithubPRDto);
    return await this.workCommandHandler.handleGithubPR(createGithubPRDto);
  }

  @ApiParam({ name: 'id', type: 'string' })
  @SetMetadata('permissions', ['update'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id')
  async update(
    @Param() params: ObjectIdDto,
    @Body() card: UpdateCardRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardCommandHandler.update(params.id, card);
  }

  @Patch('/:id/updateStatusFromBot')
  @UseGuards(PublicViewAuthGuard)
  async updateStatusFromBot(
    @Param() params: ObjectIdDto,
    @Body() updateStatusDto: UpdateCardStatusRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardCommandHandler.update(params.id, updateStatusDto);
  }

  @SetMetadata('permissions', ['submit'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/createWorkThread')
  async createWorkThread(
    @Param() params: ObjectIdDto,
    @Body() createWorkThread: CreateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.workCommandHandler.handleCreateWorkThread(
      params.id,
      createWorkThread,
    );
  }

  @SetMetadata('permissions', ['submit'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/updateWorkThread')
  async updateWorkThread(
    @Param() params: ObjectIdDto,
    @Query() threadIdParam: RequiredThreadIdDto,
    @Body() updateWorkThread: UpdateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.workCommandHandler.handleUpdateWorkThread(
      params.id,
      threadIdParam.threadId,
      updateWorkThread,
    );
  }

  @SetMetadata('permissions', ['submit'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/createWorkUnit')
  async createWorkUnit(
    @Param() params: ObjectIdDto,
    @Query() threadIdParam: RequiredThreadIdDto,
    @Body() createWorkUnit: CreateWorkUnitRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.workCommandHandler.handleCreateWorkUnit(
      params.id,
      threadIdParam.threadId,
      createWorkUnit,
    );
  }

  @SetMetadata('permissions', ['submit'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/updateWorkUnit')
  async updateWorkUnit(
    @Param() params: ObjectIdDto,
    @Query() threadIdParam: RequiredThreadIdDto,
    @Query() workUnitIdParam: RequiredWorkUnitIdDto,
    @Body() updateWorkUnit: UpdateWorkUnitRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.workCommandHandler.handleUpdateWorkUnit(
      params.id,
      threadIdParam.threadId,
      workUnitIdParam.workUnitId,
      updateWorkUnit,
    );
  }

  @ApiParam({ name: 'id', type: 'string' })
  @UseGuards(SessionAuthGuard)
  @Patch('/:id/addComment')
  async addComment(
    @Param() params: ObjectIdDto,
    @Body() addCommentDto: AddCommentDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.commentService.addComment(params.id, addCommentDto);
  }

  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'commitId', type: 'string' })
  @UseGuards(SessionAuthGuard)
  @Patch('/:id/updateComment')
  async udpateComment(
    @Param() params: ObjectIdDto,
    @Query() commitIdParam: RequiredCommitIdDto,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.commentService.updateComment(
      params.id,
      commitIdParam.commitId,
      updateCommentDto,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/deleteComment')
  async deleteComment(
    @Param() params: ObjectIdDto,
    @Query() commitIdParam: RequiredCommitIdDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.commentService.deleteComment(
      params.id,
      commitIdParam.commitId,
    );
  }

  @SetMetadata('permissions', ['update'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/archive')
  async archive(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.cardsService.archive(params.id);
  }

  @SetMetadata('permissions', ['update'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/revertArchive')
  async revertArchive(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.revertArchive(params.id);
  }

  @ApiParam({ name: 'id' })
  @SetMetadata('permissions', ['apply'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/createApplication')
  async createApplication(
    @Param() params: ObjectIdDto,
    @Body() createApplicationDto: CreateApplicationDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.applicationService.createApplication(
      params.id,
      createApplicationDto,
    );
  }

  @ApiQuery({ name: 'applicationId', type: 'string' })
  @ApiParam({ name: 'id' })
  @SetMetadata('permissions', ['apply'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/updateApplication')
  async updateApplication(
    @Param() params: ObjectIdDto,
    @Query() updateApplicationQueryParam: UpdateApplicationParamDto,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.applicationService.updateApplication(
      params.id,
      updateApplicationQueryParam.applicationId,
      updateApplicationDto,
    );
  }

  @UseGuards(CardAuthGuard)
  @SetMetadata('permissions', ['apply'])
  @Patch('/:id/deleteApplication')
  async deleteApplication(
    @Param() params: ObjectIdDto,
    @Query() updateApplicationQueryParam: UpdateApplicationParamDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.applicationService.deleteApplication(
      params.id,
      updateApplicationQueryParam.applicationId,
    );
  }

  @UseGuards(CardAuthGuard)
  @SetMetadata('permissions', ['update'])
  @Patch('/:id/pickApplications')
  @ApiParam({ name: 'id' })
  async pickApplications(
    @Param() params: ObjectIdDto,
    @Body() applications: PickApplicationDto,
  ): Promise<DetailedCardResponseDto> {
    console.log(applications);
    return await this.applicationService.pickApplications(
      params.id,
      applications.applicationIds,
    );
  }
}

// temp

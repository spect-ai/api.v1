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
  CardAuthGuard,
  CircleAuthGuard,
  CreateNewCardAuthGuard,
  PublicViewAuthGuard,
  SessionAuthGuard,
} from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import {
  GetByProjectAndSlugDto,
  GetByProjectSlugAndCardSlugDto,
} from './dto/get-card-params.dto';
import { UpdateCardRequestDto } from './dto/update-card-request.dto';
import {
  UpdateWorkUnitRequestDto,
  CreateWorkThreadRequestDto,
  UpdateWorkThreadRequestDto,
  CreateWorkUnitRequestDto,
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

@Controller('card')
@ApiTags('card')
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly actionService: ActionService,
    private readonly applicationService: ApplicationService,
    private readonly workService: WorkService,
    private readonly commentService: CommentService,
    private readonly paymentService: CardsPaymentService,
    private readonly cardCommandHandler: CardCommandHandler,
    private readonly workCommandHandler: WorkCommandHandler,
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
    project: DetailedProjectResponseDto;
  }> {
    return await this.cardsService.create(card);
  }

  @ApiParam({ name: 'id', type: 'string' })
  @UseGuards(CardAuthGuard)
  @Patch('/:id')
  async updateNew(
    @Param() params: ObjectIdDto,
    @Body() card: UpdateCardRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardCommandHandler.update(params.id, card);
  }

  @Patch('/:id/createWorkThreadWithPR')
  async createWorkThreadWithPR(
    @Param() params: ObjectIdDto,
    @Body() createWorkThread: CreateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.workCommandHandler.handleCreateWorkThread(
      params.id,
      createWorkThread,
    );
  }

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

  @UseGuards(CardAuthGuard)
  @Patch('/:id/updateWorkThread')
  async updateWorkThread(
    @Param() params: ObjectIdDto,
    @Query('threadId') threadId: string,
    @Body() updateWorkThread: UpdateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.workCommandHandler.handleUpdateWorkThread(
      params.id,
      threadId,
      updateWorkThread,
    );
  }

  @UseGuards(CardAuthGuard)
  @Patch('/:id/createWorkUnit')
  async createWorkUnit(
    @Param() params: ObjectIdDto,
    @Query('threadId') threadId: string,
    @Body() createWorkUnit: CreateWorkUnitRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.workCommandHandler.handleCreateWorkUnit(
      params.id,
      threadId,
      createWorkUnit,
    );
  }

  @UseGuards(CardAuthGuard)
  @Patch('/:id/updateWorkUnit')
  async updateWorkUnit(
    @Param() params: ObjectIdDto,
    @Query('threadId') threadId: string,
    @Query('workUnitId') workUnitId: string,
    @Body() updateWorkUnit: UpdateWorkUnitRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.workCommandHandler.handleUpdateWorkUnit(
      params.id,
      threadId,
      workUnitId,
      updateWorkUnit,
    );
  }

  @ApiParam({ name: 'id', type: 'string' })
  @UseGuards(CardAuthGuard)
  @Patch('/:id/addComment')
  async addComment(
    @Param() params: ObjectIdDto,
    @Body() addCommentDto: AddCommentDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.commentService.addComment(params.id, addCommentDto);
  }

  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'commitId', type: 'string' })
  @UseGuards(CardAuthGuard)
  @Patch('/:id/updateComment')
  async udpateComment(
    @Param() params: ObjectIdDto,
    @Query('commitId') commitId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.commentService.updateComment(
      params.id,
      commitId,
      updateCommentDto,
    );
  }

  @UseGuards(CardAuthGuard)
  @Patch('/:id/deleteComment')
  async deleteComment(
    @Param() params: ObjectIdDto,
    @Query('commitId') commitId: string,
  ): Promise<DetailedCardResponseDto> {
    return await this.commentService.deleteComment(params.id, commitId);
  }

  @UseGuards(CardAuthGuard)
  @Patch('/:id/archive')
  async archive(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.cardsService.archive(params.id);
  }

  @UseGuards(CardAuthGuard)
  @Patch('/:id/revertArchive')
  async revertArchive(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.revertArchive(params.id);
  }

  @ApiParam({ name: 'id' })
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

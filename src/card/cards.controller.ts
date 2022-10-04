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
import {
  CardAuthGuard,
  CreateGithubPRAuthGuard,
  CreateNewCardAuthGuard,
} from 'src/auth/card.guard';
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
import { WorkCommandHandler } from './handlers/work.command.handler';
import {
  RequiredCommitIdDto,
  RequiredSlugDto,
  RequiredThreadIdDto,
  RequiredWorkUnitIdDto,
} from 'src/common/dtos/string.dto';

@Controller('card')
@ApiTags('card')
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly actionService: ActionService,
    private readonly applicationService: ApplicationService,
    private readonly commentService: CommentService,
    private readonly paymentService: CardsPaymentService,
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
  @ApiQuery({ name: 'payForChildren', type: 'boolean' })
  async getAggregatedPaymentInfo(
    @Query('cardIds') cardIds: string[],
    @Query('chainId') chainId: string,
    @Query('payCircle') payCircle: string,
    @Query('payForChildren') payForChildren: boolean,
  ): Promise<AggregatedFlattenedPaymentInfo> {
    if (typeof cardIds === 'string') {
      cardIds = [cardIds];
    }
    return await this.paymentService.aggregatePaymentInfo(
      cardIds,
      chainId,
      payCircle === 'true',
      payForChildren || true,
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

  @Patch('/createWorkThreadWithPR')
  @UseGuards(CreateGithubPRAuthGuard)
  async createWorkThreadWithPR(
    @Body() createGithubPRDto: CreateGithubPRDto,
  ): Promise<boolean> {
    return await this.workCommandHandler.handleGithubPR(createGithubPRDto);
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
    return await this.applicationService.pickApplications(
      params.id,
      applications.applicationIds,
    );
  }
}

// temp

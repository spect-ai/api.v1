import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
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
import { ValidCardActionResponseDto } from './dto/card-access-response.dto';
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

@Controller('card')
@ApiTags('card')
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly actionService: ActionService,
    private readonly applicationService: ApplicationService,
    private readonly workService: WorkService,
  ) {}

  @Get('/byProjectSlugAndCardSlug/:projectSlug/:cardSlug')
  async findByProjectSlugAndCardSlug(
    @Param() params: GetByProjectSlugAndCardSlugDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.getDetailedCardByProjectSlugAndCardSlug(
      params.projectSlug,
      params.cardSlug,
    );
  }

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
    return await this.cardsService.aggregatePaymentInfo(cardIds, chainId);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/updatePaymentInfoAndClose')
  async updatePaymentInfoAndClose(
    @Body() updatePaymentInfoDto: UpdatePaymentInfoDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.cardsService.updatePaymentInfoAndClose(
      updatePaymentInfoDto,
    );
  }

  @Get('/:id')
  async findByObjectId(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.getDetailedCard(params.id);
  }

  @Get('/:id/myValidActions')
  @ApiParam({ name: 'id', type: 'string' })
  @UseGuards(SessionAuthGuard)
  async getValidActions(
    @Param() params: ObjectIdDto,
  ): Promise<ValidCardActionResponseDto> {
    return await this.actionService.getValidActions(params.id);
  }

  @Post('/')
  @UseGuards(SessionAuthGuard)
  async create(@Body() card: CreateCardRequestDto): Promise<{
    card: DetailedCardResponseDto;
    project: DetailedProjectResponseDto;
  }> {
    return await this.cardsService.create(card);
  }

  @Patch('/:id')
  @UseGuards(SessionAuthGuard)
  @ApiParam({ name: 'id', type: 'string' })
  async update(
    @Param() params: ObjectIdDto,
    @Body() card: UpdateCardRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.update(params.id, card);
  }

  @Patch('/:id/createWorkThread')
  @UseGuards(SessionAuthGuard)
  async createWorkThread(
    @Param() params: ObjectIdDto,
    @Body() createWorkThread: CreateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.workService.createWorkThread(params.id, createWorkThread);
  }

  @Patch('/:id/updateWorkThread')
  @UseGuards(SessionAuthGuard)
  async updateWorkThread(
    @Param() params: ObjectIdDto,
    @Query('threadId') threadId: string,
    @Body() updateWorkThread: UpdateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.workService.updateWorkThread(
      params.id,
      threadId,
      updateWorkThread,
    );
  }

  @Patch('/:id/createWorkUnit')
  @UseGuards(SessionAuthGuard)
  async createWorkUnit(
    @Param() params: ObjectIdDto,
    @Query('threadId') threadId: string,
    @Body() createWorkUnit: CreateWorkUnitRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.workService.createWorkUnit(
      params.id,
      threadId,
      createWorkUnit,
    );
  }

  @Patch('/:id/updateWorkUnit')
  @UseGuards(SessionAuthGuard)
  async updateWorkUnit(
    @Param() params: ObjectIdDto,
    @Query('threadId') threadId: string,
    @Query('workUnitId') workUnitId: string,
    @Body() updateWorkUnit: UpdateWorkUnitRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.workService.udpateWorkUnit(
      params.id,
      threadId,
      workUnitId,
      updateWorkUnit,
    );
  }

  @Patch('/:id/addComment')
  @ApiParam({ name: 'id', type: 'string' })
  @UseGuards(SessionAuthGuard)
  async addComment(
    @Param() params: ObjectIdDto,
    @Body() addCommentDto: AddCommentDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.addComment(params.id, addCommentDto);
  }

  @Patch('/:id/updateComment')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'commitId', type: 'string' })
  @UseGuards(SessionAuthGuard)
  async udpateComment(
    @Param() params: ObjectIdDto,
    @Query('commitId') commitId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.updateComment(
      params.id,
      commitId,
      updateCommentDto,
    );
  }

  @Patch('/:id/deleteComment')
  @UseGuards(SessionAuthGuard)
  async deleteComment(
    @Param() params: ObjectIdDto,
    @Query('commitId') commitId: string,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.deleteComment(params.id, commitId);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/archive')
  async archive(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.archive(params.id);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/revertArchive')
  async revertArchive(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.revertArchive(params.id);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/createApplication')
  @ApiParam({ name: 'id' })
  async createApplication(
    @Param() params: ObjectIdDto,
    @Body() createApplicationDto: CreateApplicationDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.applicationService.createApplication(
      params.id,
      createApplicationDto,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/updateApplication')
  @ApiQuery({ name: 'applicationId', type: 'string' })
  @ApiParam({ name: 'id' })
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

  @UseGuards(SessionAuthGuard)
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

  @UseGuards(SessionAuthGuard)
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

  @UseGuards(SessionAuthGuard)
  @Post('/:id/delete')
  async delete(@Param() params: ObjectIdDto): Promise<DetailedCardResponseDto> {
    return await this.cardsService.delete(params.id);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { CardsService } from './cards.service';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { GetByProjectAndSlugDto } from './dto/get-by-project-and-slug.dto';
import { UpdateCardRequestDto } from './dto/update-card-request.dto';
import {
  UpdateWorkUnitRequestDto,
  CreateWorkThreadRequestDto,
  UpdateWorkThreadRequestDto,
  CreateWorkUnitRequestDto,
} from './dto/work-request.dto';
import { AddCommentDto, UpdateCommentDto } from './dto/comment-body.dto';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ActionService } from './actions.service';
import { ValidCardActionResponseDto } from './dto/card-access-response.dto';

@Controller('card')
@ApiTags('card')
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly actionService: ActionService,
  ) {}

  @Get('/byProjectAndSlug/:project/:slug')
  async findBySlug(
    @Param() params: GetByProjectAndSlugDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.getDetailedCardBySlug(
      params.project,
      params.slug,
    );
  }

  @Get('/:id')
  async findByObjectId(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.getDetailedCard(params.id);
  }

  @Get('/:id/myValidActions')
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

  @UseGuards(SessionAuthGuard)
  @Patch('/:id')
  @UseGuards(SessionAuthGuard)
  async update(
    @Param() params: ObjectIdDto,
    @Body() card: UpdateCardRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.update(params.id, card);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/createWorkThread')
  @UseGuards(SessionAuthGuard)
  async createWorkThread(
    @Param() params: ObjectIdDto,
    @Body() createWorkThread: CreateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.createWorkThread(
      params.id,
      createWorkThread,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/updateWorkThread')
  @UseGuards(SessionAuthGuard)
  async updateWorkThread(
    @Param() params: ObjectIdDto,
    @Query('threadId') threadId: string,
    @Body() updateWorkThread: UpdateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.updateWorkThread(
      params.id,
      threadId,
      updateWorkThread,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/createWorkUnit')
  @UseGuards(SessionAuthGuard)
  async createWorkUnit(
    @Param() params: ObjectIdDto,
    @Query('threadId') threadId: string,
    @Body() createWorkUnit: CreateWorkUnitRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.createWorkUnit(
      params.id,
      threadId,
      createWorkUnit,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/updateWorkUnit')
  @UseGuards(SessionAuthGuard)
  async updateWorkUnit(
    @Param() params: ObjectIdDto,
    @Query('threadId') threadId: string,
    @Query('workUnitId') workUnitId: string,
    @Body() updateWorkUnit: UpdateWorkUnitRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.udpateWorkUnit(
      params.id,
      threadId,
      workUnitId,
      updateWorkUnit,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/addComment')
  @ApiParam({ name: 'id', type: 'string' })
  @UseGuards(SessionAuthGuard)
  async addComment(
    @Param() params: ObjectIdDto,
    @Body() addCommentDto: AddCommentDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.addComment(params.id, addCommentDto);
  }

  @UseGuards(SessionAuthGuard)
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

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/deleteComment')
  @UseGuards(SessionAuthGuard)
  async deleteComment(
    @Param() params: ObjectIdDto,
    @Query('commitId') commitId: string,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.deleteComment(params.id, commitId);
  }

  @UseGuards(SessionAuthGuard)
  @Post('/:id/delete')
  async delete(@Param() params: ObjectIdDto): Promise<DetailedCardResponseDto> {
    return await this.cardsService.delete(params.id);
  }
}

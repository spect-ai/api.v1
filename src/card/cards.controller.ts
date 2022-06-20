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
import { ObjectIdDto } from 'src/common/validators/object-id.dto';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { CardsService } from './cards.service';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { GetByProjectAndSlugDto } from './dto/get-by-project-and-slug.dto';
import { UpdateCardRequestDto } from './dto/update-card-request.dto';
import {
  UpdateWorkThreadParamDto,
  CreateWorkUnitParamDto,
  UpdateWorkUnitParamDto,
} from './dto/param.dto';
import {
  UpdateWorkUnitRequestDto,
  CreateWorkThreadRequestDto,
  UpdateWorkThreadRequestDto,
  CreateWorkUnitRequestDto,
} from './dto/work-request.dto';

@Controller('card')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

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

  @Post('/')
  @UseGuards(SessionAuthGuard)
  async create(
    @Body() card: CreateCardRequestDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.cardsService.create(card);
  }

  @Patch('/:id')
  async update(
    @Param() params: ObjectIdDto,
    @Body() card: UpdateCardRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.update(params.id, card);
  }

  @Patch('/:id/createWorkThread')
  async createWorkThread(
    @Param() params: ObjectIdDto,
    @Body() createWorkThread: CreateWorkThreadRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.createWorkThread(
      params.id,
      createWorkThread,
    );
  }

  @Patch('/:id/updateWorkThread')
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

  @Patch('/:id/createWorkUnit')
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

  @Patch('/:id/updateWorkUnit')
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
  @Post('/:id/delete')
  async delete(@Param() params: ObjectIdDto): Promise<DetailedCardResponseDto> {
    return await this.cardsService.delete(params.id);
  }
}

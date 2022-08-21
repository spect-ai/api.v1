import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { CardAuthGuard, CreateNewCardAuthGuard } from 'src/auth/card.guard';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { CrudOrchestrator } from './orchestrators/crud.orchestrator';
import { UpdatePaymentCommand } from './commands/impl';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { UpdateCardRequestDto } from './dto/update-card-request.dto';
import { UpdatePaymentInfoDto } from './dto/update-payment-info.dto';
import { GetCardByIdQuery } from './queries/impl';
import {
  CreateWorkThreadCommand,
  CreateWorkUnitCommand,
  UpdateWorkThreadCommand,
  UpdateWorkUnitCommand,
} from './commands/work/impl';
import {
  CreateWorkThreadRequestDto,
  CreateWorkUnitRequestDto,
  UpdateWorkThreadRequestDto,
  UpdateWorkUnitRequestDto,
} from './dto/work-request.dto';
import {
  RequiredThreadIdDto,
  RequiredWorkUnitIdDto,
} from 'src/common/dtos/string.dto';

@Controller('card/v1')
@ApiTags('cardv1')
export class CardsV1Controller {
  constructor(
    private readonly crudOrchestrator: CrudOrchestrator,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('/:id')
  async findByObjectId(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.queryBus.execute(new GetCardByIdQuery(params.id));
  }

  @Post('/')
  @UseGuards(CreateNewCardAuthGuard)
  async create(@Body() card: CreateCardRequestDto): Promise<{
    card: DetailedCardResponseDto;
  }> {
    return await this.crudOrchestrator.create(card);
  }

  @SetMetadata('permissions', ['update'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/archive')
  async archive(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.crudOrchestrator.archive(params.id);
  }

  @SetMetadata('permissions', ['update'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/revertArchive')
  async revertArchive(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedProjectResponseDto> {
    return await this.crudOrchestrator.revertArchival(params.id);
  }

  @SetMetadata('permissions', ['update'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/')
  async update(
    @Param() params: ObjectIdDto,
    @Body() updateCardRequestDto: UpdateCardRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.crudOrchestrator.update(params.id, updateCardRequestDto);
  }

  @SetMetadata('permissions', ['submit'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/createWorkThread')
  async createWorkThread(
    @Param() params: ObjectIdDto,
    @Body() createWorkThread: CreateWorkThreadRequestDto,
    @Request() req,
  ): Promise<DetailedCardResponseDto> {
    return await this.commandBus.execute(
      new CreateWorkThreadCommand(params.id, createWorkThread, req.user.id),
    );
  }

  @SetMetadata('permissions', ['submit'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/updateWorkThread')
  async updateWorkThread(
    @Param() params: ObjectIdDto,
    @Query() threadIdParam: RequiredThreadIdDto,
    @Body() updateWorkThread: UpdateWorkThreadRequestDto,
    @Request() req,
  ): Promise<DetailedCardResponseDto> {
    return await this.commandBus.execute(
      new UpdateWorkThreadCommand(
        params.id,
        threadIdParam.threadId,
        updateWorkThread,
        req.user.id,
      ),
    );
  }

  @SetMetadata('permissions', ['submit'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/createWorkUnit')
  async createWorkUnit(
    @Param() params: ObjectIdDto,
    @Query() threadIdParam: RequiredThreadIdDto,
    @Body() createWorkUnit: CreateWorkUnitRequestDto,
    @Request() req,
  ): Promise<DetailedCardResponseDto> {
    return await this.commandBus.execute(
      new CreateWorkUnitCommand(
        params.id,
        threadIdParam.threadId,
        createWorkUnit,
        req.user.id,
      ),
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
    @Request() req,
  ): Promise<DetailedCardResponseDto> {
    return await this.commandBus.execute(
      new UpdateWorkUnitCommand(
        params.id,
        threadIdParam.threadId,
        workUnitIdParam.workUnitId,
        updateWorkUnit,
        req.user.id,
      ),
    );
  }
}

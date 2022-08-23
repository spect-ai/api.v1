import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { CardsV1Service } from './cards-v1.service';
import { UpdatePaymentCommand } from './commands/impl';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { UpdateCardProjectDto } from './dto/update-card-project.dto';
import { UpdatePaymentInfoDto } from './dto/update-payment-info.dto';
import { GetCardByIdQuery } from './queries/impl';

@Controller('card/v1')
@ApiTags('cardv1')
export class CardsV1Controller {
  constructor(
    private readonly cardsService: CardsV1Service,
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
    return await this.cardsService.create(card);
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
  ): Promise<DetailedProjectResponseDto> {
    return await this.cardsService.revertArchival(params.id);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/updatePaymentInfoAndClose')
  async updatePaymentInfoAndClose(
    @Body() updatePaymentInfoDto: UpdatePaymentInfoDto,
    @Request() req,
  ): Promise<DetailedProjectResponseDto> {
    return await this.commandBus.execute(
      new UpdatePaymentCommand(updatePaymentInfoDto, req.user.id),
    );
  }

  @SetMetadata('permissions', ['update'])
  @UseGuards(CardAuthGuard)
  @Patch('/:id/updateProject')
  async updateCardProject(
    @Body() updateCardProjectDto: UpdateCardProjectDto,
    @Param() params: ObjectIdDto,
    @Request() req,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsService.updateCardProject(
      params.id,
      updateCardProjectDto.projectId,
      req.user.id,
    );
  }
}

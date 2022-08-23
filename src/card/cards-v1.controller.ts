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
import {
  CardAuthGuard,
  CreateNewCardAuthGuard,
  ViewCardAuthGuard,
} from 'src/auth/card.guard';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import { RequiredRoleDto, RequiredSlugDto } from 'src/common/dtos/string.dto';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { CardsV1Service } from './cards-v1.service';
import { UpdatePaymentCommand } from './commands/impl';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { GetByProjectSlugAndCardSlugDto } from './dto/get-card-params.dto';
import { UpdatePaymentInfoDto } from './dto/update-payment-info.dto';
import { GetCardByIdQuery, GetCardBySlugQuery } from './queries/impl';

@Controller('card/v1')
@ApiTags('cardv1')
export class CardsV1Controller {
  constructor(
    private readonly cardsService: CardsV1Service,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @UseGuards(ViewCardAuthGuard)
  @Get('/:id')
  async findByObjectId(
    @Param() params: ObjectIdDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.queryBus.execute(new GetCardByIdQuery(params.id));
  }

  @UseGuards(ViewCardAuthGuard)
  @Get('/slug/:slug')
  async findBySlug(
    @Param() params: RequiredSlugDto,
  ): Promise<DetailedCardResponseDto> {
    console.log(params.slug);
    return await this.queryBus.execute(new GetCardBySlugQuery(params.slug));
  }

  @UseGuards(ViewCardAuthGuard)
  @Get('/byProjectSlugAndCardSlug/:projectSlug/:cardSlug')
  async findByProjectSlugAndCardSlug(
    @Param() params: GetByProjectSlugAndCardSlugDto,
  ): Promise<DetailedCardResponseDto> {
    console.log(params.cardSlug);
    return await this.cardsService.get(params.projectSlug, params.cardSlug);
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
}

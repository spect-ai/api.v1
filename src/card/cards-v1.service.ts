import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';
import { AddCardsCommand } from 'src/project/commands/impl';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import {
  GetProjectByIdQuery,
  GetProjectBySlugQuery,
} from 'src/project/queries/impl';
import { RequestProvider } from 'src/users/user.provider';
import { ArchiveCardByIdCommand } from './commands/archive/impl/archive-card.command';
import {
  CreateCardCommand,
  RevertArchiveCardByIdCommand,
} from './commands/impl';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import {
  CardArchivalRevertedEvent,
  CardsArchivedEvent,
} from './events/archive/impl/card-archived.event';
import { CardCreatedEvent } from './events/impl';
import { Card } from './model/card.model';
import { GetCardByFilterQuery, GetCardByIdQuery } from './queries/impl';
import { ResponseBuilder } from './response.builder';
import { CardValidationService } from './validation.cards.service';

@Injectable()
export class CardsV1Service {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly commonTools: CommonTools,
    private readonly logger: LoggingService,
    private readonly validationService: CardValidationService,
    private readonly responseBuilder: ResponseBuilder,
    private readonly eventBus: EventBus,
  ) {
    logger.setContext('CardsV1Service');
  }

  async get(
    projectSlug: string,
    cardSlug: string,
  ): Promise<DetailedCardResponseDto> {
    try {
      const project = await this.queryBus.execute(
        new GetProjectBySlugQuery(projectSlug),
      );
      const card = await this.queryBus.execute(
        new GetCardByFilterQuery({
          slug: cardSlug,
          project: project.id,
        }),
      );
      console.log(card);
      return await this.responseBuilder.enrichResponse(card);
    } catch (error) {
      this.logger.logError(
        `Failed card retrieval by slug with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed card retrieval',
        error.message,
      );
    }
  }

  async create(createCardDto: CreateCardRequestDto): Promise<{
    card: DetailedCardResponseDto;
    project: DetailedProjectResponseDto;
  }> {
    try {
      let project =
        this.requestProvider.project ||
        (await this.queryBus.execute(
          new GetProjectByIdQuery(createCardDto.project),
        ));
      const circle =
        this.requestProvider.circle ||
        (await this.queryBus.execute(
          new GetCircleByIdQuery(createCardDto.circle),
        ));
      /** In case this is a sub card, find the parent card and validate it exists */
      let parentCard: Card;
      if (createCardDto.parent) {
        parentCard = await this.queryBus.execute(
          new GetCardByIdQuery(createCardDto.parent),
        );
        this.validationService.validateCardExists(parentCard);
      }

      const card = await this.commandBus.execute(
        new CreateCardCommand(
          createCardDto,
          project,
          circle,
          this.requestProvider.user.id,
          parentCard,
        ),
      );
      if (!createCardDto.parent) {
        project = await this.commandBus.execute(
          new AddCardsCommand([card], project),
        );
      }
      this.eventBus.publish(
        new CardCreatedEvent(card, project.slug, circle.slug),
      );

      return {
        card: await this.responseBuilder.enrichResponse(card),
        project: {
          ...project,
          cards: this.commonTools.objectify(project.cards, 'id'),
        },
      };
    } catch (error) {
      this.logger.logError(
        `Failed creating new card with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed creating new card',
        error.message,
      );
    }
  }

  async archive(id: string): Promise<DetailedProjectResponseDto> {
    try {
      const { project, cards } = await this.commandBus.execute(
        new ArchiveCardByIdCommand(id),
      );
      this.eventBus.publish(new CardsArchivedEvent(cards));
      return {
        ...project,
        cards: this.commonTools.objectify(project.cards, 'id'),
      };
    } catch (error) {
      this.logger.logError(
        `Failed archiving card with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed archiving card',
        error.message,
      );
    }
  }

  async revertArchival(id: string): Promise<DetailedProjectResponseDto> {
    try {
      const { project, cards } = await this.commandBus.execute(
        new RevertArchiveCardByIdCommand(id),
      );
      this.eventBus.publish(new CardArchivalRevertedEvent(cards));
      return {
        ...project,
        cards: this.commonTools.objectify(project.cards, 'id'),
      };
    } catch (error) {
      this.logger.logError(
        `Failed reverting archival with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed reverting archival',
        error.message,
      );
    }
  }
}

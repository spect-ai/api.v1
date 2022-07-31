import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { CommonTools } from 'src/common/common.service';
import { AddCardsCommand } from 'src/project/commands/impl';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { Project } from 'src/project/model/project.model';
import { GetProjectByIdQuery } from 'src/project/queries/impl';
import { RequestProvider } from 'src/users/user.provider';
import { CreateCardCommand } from './commands/impl';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { LoggingService } from 'src/logging/logging.service';
import { Card } from './model/card.model';
import { GetCardByIdQuery } from './queries/impl';
import { CardValidationService } from './validation.cards.service';
import { ResponseBuilder } from './response.builder';

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
  ) {
    logger.setContext('CardsV1Service');
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
          new AddCardsCommand([card], project, this.requestProvider.user.id),
        );
      }
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
}

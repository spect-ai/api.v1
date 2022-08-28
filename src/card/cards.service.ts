import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ActivityBuilder } from 'src/card/activity.builder';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CardsProjectService } from 'src/project/cards.project.service';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { Project } from 'src/project/model/project.model';
import { ProjectService } from 'src/project/project.service';
import { RequestProvider } from 'src/users/user.provider';
import { CardsRepository } from './cards.repository';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { UpdateCardRequestDto } from './dto/update-card-request.dto';
import { Card } from './model/card.model';
import { ResponseBuilder } from './response.builder';
import { Diff, MappedCard } from './types/types';
import { CardValidationService } from './validation.cards.service';
import { CommonTools } from 'src/common/common.service';
import { Circle } from 'src/circle/model/circle.model';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class CardsService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly activityBuilder: ActivityBuilder,
    private readonly circleRepository: CirclesRepository,
    private readonly projectService: ProjectService,
    private readonly cardsProjectService: CardsProjectService,
    private readonly validationService: CardValidationService,
    private readonly responseBuilder: ResponseBuilder,
    private readonly commonTools: CommonTools,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('CardsService');
  }

  getDifference(card: Card, request: UpdateCardRequestDto): Diff {
    const filteredCard = {};
    const filteredCardArrayFields = {};
    const filteredRequest = {};

    for (const key in request) {
      if (Array.isArray(card[key])) filteredCardArrayFields[key] = card[key];
      else {
        filteredCard[key] = card[key];
        filteredRequest[key] = request[key];
      }
    }

    const objDiff = this.commonTools.findDifference(
      filteredCard,
      filteredRequest,
    ) as Diff;
    const arrayDiff = {};
    for (const key in filteredCardArrayFields) {
      arrayDiff[key] = this.commonTools.findDifference(
        filteredCardArrayFields[key],
        request[key],
      );
      if (arrayDiff[key]['added'].length > 0) {
        objDiff['added'] = {
          ...objDiff['added'],
          [key]: arrayDiff[key]['added'],
        };
      }
      if (arrayDiff[key]['removed'].length > 0) {
        objDiff['deleted'] = {
          ...objDiff['deleted'],
          [key]: arrayDiff[key]['removed'],
        };
      }
    }
    return objDiff;
  }

  async getDetailedCard(id: string): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.getCardWithPopulatedReferences(
        id,
      );
      return card;
    } catch (error) {
      this.logger.logError(
        `Failed card retrieval by id with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed card retrieval',
        error.message,
      );
    }
  }

  async getDetailedCardByProjectSlugAndCardSlug(
    projectSlug: string,
    cardSlug: string,
  ): Promise<DetailedCardResponseDto> {
    try {
      const project = await this.projectService.getProjectIdFromSlug(
        projectSlug,
      );
      return await this.getDetailedCardByProjectIdAndCardSlug(
        project.id,
        cardSlug,
      );
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

  async getDetailedCardByProjectIdAndCardSlug(
    project: string,
    slug: string,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card =
        await this.cardsRepository.getCardWithPopulatedReferencesBySlug(
          project,
          slug,
        );
      return await this.responseBuilder.enrichResponse(card);
    } catch (error) {
      this.logger.logError(
        `Failed card retrieval by project id and card slug with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed card retrieval',
        error.message,
      );
    }
  }

  closeCard(card: Card): MappedCard {
    const activities = this.activityBuilder.buildUpdatedCardActivity(
      {
        status: {
          active: false,
          paid: true,
          archived: true,
        },
      },
      card,
    );

    return {
      [card.id]: {
        activity: card.activity.concat(activities),
        status: {
          ...card.status,
          active: false,
        },
      },
    };
  }
}

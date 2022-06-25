import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
import { ProjectService } from 'src/project/project.service';
import { RequestProvider } from 'src/users/user.provider';
import { ActivityBuilder } from './activity.builder';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
} from './dto/application.dto';
import { v4 as uuidv4 } from 'uuid';
import { Card } from './model/card.model';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';

@Injectable()
export class BountyService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly cardsService: CardsService,
    private readonly activityBuilder: ActivityBuilder,
    private readonly datastructureManipulationService: DataStructureManipulationService,
  ) {}

  validateApplicationExists(card: Card, applicationId: string) {
    if (!card.application[applicationId]) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }
  }

  validateUserHasntSubmittedApplicaiton(card: Card) {
    for (const [applicationId, application] of Object.entries(
      card.application,
    )) {
      if (application.user.toString() === this.requestProvider.user.id) {
        throw new HttpException(
          'User has already submitted application',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async createApplication(
    id: string,
    createApplicationDto: CreateApplicationDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.cardsService.validateCardExists(card);
      this.validateUserHasntSubmittedApplicaiton(card);

      const applicationId = uuidv4();

      const applicationOrder = [...card.applicationOrder, applicationId];
      const application = {
        ...card.application,
        [applicationId]: {
          applicationId: applicationId,
          user: this.requestProvider.user._id,
          content: createApplicationDto.content,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active',
        },
      };
      const updatedCard = await this.cardsRepository
        .updateById(id, {
          application,
          applicationOrder,
        })
        .populate('project')
        .populate('circle');

      return await this.cardsService.enrichActivity(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed creating application',
        error.message,
      );
    }
  }

  async updateApplication(
    id: string,
    applicationId: string,
    updateApplicationDto: UpdateApplicationDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.cardsService.validateCardExists(card);
      this.validateApplicationExists(card, applicationId);
      card.application[applicationId] = {
        ...card.application[applicationId],
        ...updateApplicationDto,
        updatedAt: new Date(),
      };

      const updatedCard = await this.cardsRepository
        .updateById(id, {
          application: card.application,
        })
        .populate('project')
        .populate('circle');

      return await this.cardsService.enrichActivity(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed updating application',
        error.message,
      );
    }
  }

  async deleteApplication(
    id: string,
    applicationId: string,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.cardsService.validateCardExists(card);
      this.validateApplicationExists(card, applicationId);

      const applicationOrder = card.applicationOrder;
      const applicationIndex = applicationOrder.indexOf(applicationId);
      applicationOrder.splice(applicationIndex, 1);
      delete card.application[applicationId];

      const updatedCard = await this.cardsRepository
        .updateById(id, {
          application: card.application,
          applicationOrder,
        })
        .populate('project')
        .populate('circle');

      return await this.cardsService.enrichActivity(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed while deleting application',
        error.message,
      );
    }
  }

  async pickApplications(id: string, applicationIds: string[]) {
    try {
      const card = await this.cardsRepository.findById(id);
      this.cardsService.validateCardExists(card);
      const assignees = [];
      for (const applicationId of applicationIds) {
        this.validateApplicationExists(card, applicationId);
        assignees.push(card.application[applicationId].user);
        card.application[applicationId].status = 'picked';
      }

      const updatedCard = await this.cardsRepository
        .updateById(id, {
          application: card.application,
          assignee: assignees,
        })
        .populate('project')
        .populate('circle');

      return await this.cardsService.enrichActivity(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed while picking applications',
        error.message,
      );
    }
  }
}

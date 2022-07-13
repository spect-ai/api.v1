import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CirclesService } from 'src/circle/circles.service';
import { ProjectsRepository } from 'src/project/project.repository';
import { RequestProvider } from 'src/users/user.provider';
import { v4 as uuidv4 } from 'uuid';
import { ActivityBuilder } from './activity.builder';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
} from './dto/application.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { ResponseBuilder } from './response.builder';
import { CardValidationService } from './validation.cards.service';

@Injectable()
export class ApplicationService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly cardsService: CardsService,
    private readonly circleService: CirclesService,
    private readonly projectRepository: ProjectsRepository,
    private readonly circleRepository: CirclesRepository,
    private readonly activityBuilder: ActivityBuilder,
    private readonly validationService: CardValidationService,
    private readonly responseBuilder: ResponseBuilder,
  ) {}

  async createApplication(
    id: string,
    createApplicationDto: CreateApplicationDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validationService.validateCardExists(card);
      this.validationService.validateUserHasntSubmittedApplicaiton(card);

      const project =
        await this.projectRepository.getProjectWithUnpPopulatedReferences(
          card.project as string,
        );
      const memberDetailsRes =
        await this.circleService.getMemberDetailsOfCircles(project.parents);

      if (!memberDetailsRes.members?.includes(this.requestProvider.user.id)) {
        const updatedCircles = await this.circleRepository.updateById(
          card.circle,
          {
            $push: {
              members: this.requestProvider.user.id,
            },
            $set: {
              [`memberRoles.${this.requestProvider.user.id}`]: ['visitor'],
            },
          },
        );
      }

      const applicationId = uuidv4();
      const applicationOrder = [...card.applicationOrder, applicationId];
      const application = {
        ...card.application,
        [applicationId]: {
          ...createApplicationDto,
          applicationId: applicationId,
          user: this.requestProvider.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active',
        },
      };
      const activity = this.activityBuilder.buildApplicationActivity(
        card,
        'create',
        createApplicationDto,
      );
      const updatedCard =
        await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
          id,
          {
            application,
            applicationOrder,
            activity: [...card.activity, activity],
          },
        );

      return await this.responseBuilder.enrichResponse(updatedCard);
    } catch (error) {
      console.log(error);
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
      this.validationService.validateCardExists(card);
      this.validationService.validateApplicationExists(card, applicationId);
      this.validationService.validateCallerIsOwner(card, applicationId);

      const activity = this.activityBuilder.buildApplicationActivity(
        card,
        'update',
        updateApplicationDto,
        applicationId,
      );
      card.application[applicationId] = {
        ...card.application[applicationId],
        ...updateApplicationDto,
        updatedAt: new Date(),
      };

      const updatedCard =
        await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
          id,
          {
            application: card.application,
            activity: activity ? [...card.activity, activity] : card.activity,
          },
        );

      return await this.responseBuilder.enrichResponse(updatedCard);
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
      this.validationService.validateCardExists(card);
      this.validationService.validateApplicationExists(card, applicationId);

      const activity = this.activityBuilder.buildApplicationActivity(
        card,
        'delete',
        null,
        applicationId,
      );
      const applicationOrder = card.applicationOrder;
      const applicationIndex = applicationOrder.indexOf(applicationId);
      applicationOrder.splice(applicationIndex, 1);
      delete card.application[applicationId];

      const updatedCard =
        await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
          id,
          {
            application: card.application,
            applicationOrder,
            activity: [...card.activity, activity],
          },
        );

      return await this.responseBuilder.enrichResponse(updatedCard);
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
      this.validationService.validateCardExists(card);
      const applicants = [];
      for (const applicationId of applicationIds) {
        this.validationService.validateApplicationExists(card, applicationId);
        applicants.push(card.application[applicationId].user);
        card.application[applicationId].status = 'picked';
      }
      const activity = this.activityBuilder.buildPickApplicationUpdate(
        card,
        applicants,
      );
      const updatedCard =
        await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
          id,
          {
            application: card.application,
            assignee: applicants,
            activity: activity ? [...card.activity, activity] : card.activity,
          },
        );

      return await this.responseBuilder.enrichResponse(updatedCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed while picking applications',
        error.message,
      );
    }
  }
}

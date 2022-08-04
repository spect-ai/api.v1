import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CirclesService } from 'src/circle/circles.service';
import { ProjectsRepository } from 'src/project/project.repository';
import { AddItemsCommand } from 'src/users/commands/impl';
import { UserSubmittedApplication } from 'src/users/types/types';
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
import { ApplicationPickedEvent } from './events/impl';
import { ResponseBuilder } from './response.builder';
import { CardValidationService } from './validation.cards.service';
import { LoggingService } from 'src/logging/logging.service';

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
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('ApplicationService');
  }

  async createApplication(
    id: string,
    createApplicationDto: CreateApplicationDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card =
        this.requestProvider.card || (await this.cardsRepository.findById(id));
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
              [`memberRoles.${this.requestProvider.user.id}`]: ['applicant'],
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
      await this.commandBus.execute(
        new AddItemsCommand(
          [
            {
              fieldName: 'activeApplications',
              itemIds: [
                {
                  cardId: updatedCard.id,
                  applicationTitle: createApplicationDto.title,
                } as UserSubmittedApplication,
              ],
            },
          ],
          this.requestProvider.user,
        ),
      );

      return await this.responseBuilder.enrichResponse(updatedCard);
    } catch (error) {
      this.logger.logError(
        `Failed while creating application with error: ${error.message}`,
        this.requestProvider,
      );
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
      const card =
        this.requestProvider.card || (await this.cardsRepository.findById(id));
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
      this.logger.logError(
        `Failed while updating application with error: ${error.message}`,
        this.requestProvider,
      );
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
      const card =
        this.requestProvider.card || (await this.cardsRepository.findById(id));
      this.validationService.validateApplicationExists(card, applicationId);
      this.validationService.validateCallerIsOwner(card, applicationId);

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
      this.logger.logError(
        `Failed while deleting application with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed while deleting application',
        error.message,
      );
    }
  }

  async pickApplications(id: string, applicationIds: string[]) {
    try {
      const card =
        this.requestProvider.card || (await this.cardsRepository.findById(id));
      const project =
        this.requestProvider.project ||
        (await this.projectRepository.findById(card.project as string));
      const circle =
        this.requestProvider.circle ||
        (await this.circleRepository.findById(card.circle));
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
      this.eventBus.publish(
        new ApplicationPickedEvent(
          updatedCard,
          applicationIds,
          circle.slug,
          project.slug,
          this.requestProvider.user.id,
        ),
      );
      return await this.responseBuilder.enrichResponse(updatedCard);
    } catch (error) {
      this.logger.logError(
        `Failed while picking applications with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed while picking applications',
        error.message,
      );
    }
  }
}

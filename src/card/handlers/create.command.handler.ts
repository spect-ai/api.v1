import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';
import { CardsProjectService } from 'src/project/cards.project.service';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { ProjectsRepository } from 'src/project/project.repository';
import { RequestProvider } from 'src/users/user.provider';
import { UsersRepository } from 'src/users/users.repository';
import { CardsRepository } from '../cards.repository';
import { CardsService } from '../cards.service';
import { CreateCardRequestDto } from '../dto/create-card-request.dto';
import { DetailedCardResponseDto } from '../dto/detailed-card-response-dto';
import { CardCreatedEvent } from '../events/impl';
import { Card } from '../model/card.model';
import { UserCardsService } from '../user.cards.service';
import { CardValidationService } from '../validation.cards.service';
@Injectable()
export class CreateCardCommandHandler {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly userRepository: UsersRepository,
    private readonly cardsRepository: CardsRepository,
    private readonly cardsProjectService: CardsProjectService,
    private readonly circleRepository: CirclesRepository,
    private readonly validationService: CardValidationService,
    private readonly projectRepository: ProjectsRepository,
    private readonly cardsService: CardsService,
    private readonly commonTools: CommonTools,
    private readonly userCardsService: UserCardsService,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('CreateCardCommandHandler');
  }

  async handle(createCardDto: CreateCardRequestDto): Promise<{
    card: DetailedCardResponseDto;
    project: DetailedProjectResponseDto;
    parentCard?: Card;
  }> {
    try {
      /**
       * Get project, circle, parent card and number of cards in the project which will all be
       * used to create card.
       */
      const project =
        this.requestProvider.project ||
        (await this.projectRepository.findById(createCardDto.project));
      const circle =
        this.requestProvider.circle ||
        (await this.circleRepository.findById(createCardDto.circle));
      const cardNum = await this.cardsRepository.count({
        project: createCardDto.project,
      });
      /** In case this is a sub card, find the parent card and validate it exists */
      let parentCard;
      if (createCardDto.parent) {
        parentCard =
          await this.cardsRepository.getCardWithUnpopulatedReferences(
            createCardDto.parent,
          );
        this.validationService.validateCardExists(parentCard);
      }

      /** Get the created card object */
      const newCard = await this.cardsService.createNew(
        createCardDto,
        project.slug,
        cardNum,
      );
      /** Commit to db */
      const createdCard = await this.cardsRepository.create(newCard);

      /** Get the added sub card objects */
      const newChildCards = this.cardsService.addChildCards(
        createCardDto,
        createdCard,
        circle,
        project.slug,
        cardNum + 1,
      );
      /** Commit to db */
      const createdChildCards = await this.cardsRepository.insertMany(
        newChildCards,
      );
      const projectWithCards = this.cardsProjectService.addCardsToProject(
        project,
        [createdCard, ...createdChildCards],
      );
      const updatedProject =
        await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
          project.id,
          projectWithCards[project.id],
        );

      /** Update parent card's children if it is a sub card and get the parent card object. */
      const updatedParentCard = await this.cardsService.addToParentCard(
        createdCard,
        parentCard,
      );
      /** Update current card's children if it has sub cards and get the current card object */
      const cardWithUpdatedChildren = await this.cardsService.addToParentCard(
        createdChildCards,
        createdCard,
      );

      /** Merge all the card updates */
      const updatedCards = this.commonTools.mergeObjects(
        updatedParentCard,
        cardWithUpdatedChildren,
      );

      const updateAcknowledgment =
        await this.cardsRepository.bundleUpdatesAndExecute(updatedCards);

      if (updateAcknowledgment.hasWriteErrors()) {
        throw new InternalServerErrorException(
          'Error updating cards in database',
        );
      }

      /** Get parent card and return it if there is a parent */
      if (Object.keys(updatedParentCard)?.length > 0) {
        parentCard = await this.cardsRepository.getCardWithPopulatedReferences(
          parentCard.id,
        );
      }

      const success = await this.handleUserUpdates([
        createdCard,
        ...createdChildCards,
      ]);

      this.eventBus.publish(
        new CardCreatedEvent(createdCard, project.slug, circle.slug),
      );

      return {
        card: Object.assign(createdCard, { children: createdChildCards }),
        project: {
          ...updatedProject,
          cards: this.commonTools.objectify(updatedProject.cards, 'id'),
        },
        parentCard,
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

  async handleUserUpdates(createdCards: Card[]): Promise<boolean> {
    try {
      const { assignee, reviewer } =
        this.userCardsService.getStakeholders(createdCards);
      if (assignee.length === 0 && reviewer.length === 0) return true;
      const users = await this.userRepository.findAll({
        _id: assignee.concat(reviewer),
      });
      const mappedUsers = this.commonTools.objectify(users, 'id');
      const userToCards = {};
      for (const card of createdCards) {
        this.userCardsService.addCardToUsers(
          mappedUsers,
          card.assignee,
          'assignedCards',
          userToCards,
          card.id,
        );
        this.userCardsService.addCardToUsers(
          mappedUsers,
          card.reviewer,
          'reviewingCards',
          userToCards,
          card.id,
        );
      }
      const userUpdateAcknowledgment =
        await this.userRepository.bundleUpdatesAndExecute(userToCards);

      if (userUpdateAcknowledgment.hasWriteErrors()) {
        console.log(userUpdateAcknowledgment.getWriteErrors());
        throw new InternalServerErrorException(
          'Error updating users in database',
        );
      }
      return true;
    } catch (error) {
      this.logger.logError(
        `Failed while handling user updates with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed while handling user updates',
        error.message,
      );
    }
  }
}

import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CardsProjectService } from 'src/project/cards.project.service';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { RequestProvider } from 'src/users/user.provider';
import { ActivityBuilder } from '../activity.builder';
import { CardsRepository } from '../cards.repository';
import { CreateCardRequestDto } from '../dto/create-card-request.dto';
import { DetailedCardResponseDto } from '../dto/detailed-card-response-dto';
import { Card } from '../model/card.model';
import { CardValidationService } from '../validation.cards.service';
import { CardsService } from '../cards.service';
import { ProjectsRepository } from 'src/project/project.repository';
import { CommonTools } from 'src/common/common.service';
@Injectable()
export class CreateCardCommandHandler {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly activityBuilder: ActivityBuilder,
    private readonly cardsRepository: CardsRepository,
    private readonly cardsProjectService: CardsProjectService,
    private readonly circleRepository: CirclesRepository,
    private readonly validationService: CardValidationService,
    private readonly projectRepository: ProjectsRepository,
    private readonly cardsService: CardsService,
    private readonly commonTools: CommonTools,
  ) {}

  async handle(createCardDto: CreateCardRequestDto): Promise<{
    card: Card;
    project: DetailedProjectResponseDto;
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

      const parentCardUpdateAcknowledgement =
        await this.cardsRepository.bundleUpdatesAndExecute(updatedCards);

      return {
        card: createdCard,
        project:
          this.cardsProjectService.projectPopulatedWithCardDetails(
            updatedProject,
          ),
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed creating new card',
        error.message,
      );
    }
  }
}

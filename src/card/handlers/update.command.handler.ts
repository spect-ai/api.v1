import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AutomationService } from 'src/automation/automation.service';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
import { GlobalDocumentUpdate } from 'src/common/types/update.type';
import { CardsProjectService } from 'src/project/cards.project.service';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { ReorderCardReqestDto } from 'src/project/dto/reorder-card-request.dto';
import { ProjectsRepository } from 'src/project/project.repository';
import { ProjectService } from 'src/project/project.service';
import { MappedProject } from 'src/project/types/types';
import { RequestProvider } from 'src/users/user.provider';
import { ActivityBuilder } from '../activity.builder';
import { CardsRepository } from '../cards.repository';
import { CardsService } from '../cards.service';
import { DetailedCardResponseDto } from '../dto/detailed-card-response-dto';
import { UpdateCardRequestDto } from '../dto/update-card-request.dto';
import { UpdatePaymentInfoDto } from '../dto/update-payment-info.dto';
import { CardsPaymentService } from '../payment.cards.service';
import { ResponseBuilder } from '../response.builder';
import { MappedCard } from '../types/types';
import { CardValidationService } from '../validation.cards.service';

@Injectable()
export class CardCommandHandler {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly activityBuilder: ActivityBuilder,
    private readonly circleRepository: CirclesRepository,
    private readonly projectService: ProjectService,
    private readonly cardsProjectService: CardsProjectService,
    private readonly datastructureManipulationService: DataStructureManipulationService,
    private readonly validationService: CardValidationService,
    private readonly responseBuilder: ResponseBuilder,
    private readonly cardsService: CardsService,
    private readonly projectRepository: ProjectsRepository,
    private readonly automationService: AutomationService,
    private readonly cardPaymentService: CardsPaymentService,
  ) {}

  async update(
    id: string,
    updateCardDto: UpdateCardRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validationService.validateCardExists(card);
      const project = await this.projectRepository.findById(card.project);

      const globalUpdate = {
        card: {},
        project: {},
      } as GlobalDocumentUpdate;

      const cardUpdate = this.cardsService.update(card, project, updateCardDto);

      const globalUpdateAfterAutomation =
        this.automationService.handleAutomation(card, project, cardUpdate[id]);

      let projectUpdate = {};
      if (updateCardDto.columnId || updateCardDto.cardIndex) {
        projectUpdate = this.cardsProjectService.reorderCard(project, id, {
          destinationColumnId: updateCardDto.columnId
            ? updateCardDto.columnId
            : card.columnId,
          destinationCardIndex: updateCardDto.cardIndex
            ? updateCardDto.cardIndex
            : 0,
        } as ReorderCardReqestDto);
      }

      globalUpdate.project[project.id] =
        this.datastructureManipulationService.mergeObjects(
          globalUpdate.project[project.id],
          globalUpdateAfterAutomation.project[project.id],
          projectUpdate[project.id],
        ) as MappedProject;

      globalUpdate.card[id] =
        this.datastructureManipulationService.mergeObjects(
          globalUpdate.card[id],
          globalUpdateAfterAutomation.card[id],
        ) as MappedCard;

      const acknowledgment = await this.cardsRepository.bundleUpdatesAndExecute(
        globalUpdate.card,
      );

      const projectUpdateAcknowledgment =
        await this.projectRepository.bundleUpdatesAndExecute(
          globalUpdate.project,
        );

      const resultingCard =
        await this.cardsRepository.getCardWithPopulatedReferences(id);
      return this.responseBuilder.enrichResponse(resultingCard);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed card update',
        error.message,
      );
    }
  }

  /**
   * Updates the payment info of a card with the transaction hash and sets the card to paid and closed.
   * Also, triggers automation related to the status updates.
   *
   * @param updatePaymentInfo Dto with all the cardIds and the transaction hash associated with the
   *                          batch payment used to pay for the cards
   * @returns Promise<DetailedCardResponseDto>
   *
   * Note: This method assumes all cards in the batch are for the same project
   */
  async updatePaymentInfoAndClose(
    updatePaymentInfo: UpdatePaymentInfoDto,
  ): Promise<DetailedProjectResponseDto> {
    try {
      if (updatePaymentInfo.cardIds.length === 0) {
        throw new HttpException(
          'Card ids cannot be empty',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const globalUpdate = {
        card: {},
        project: {},
      } as GlobalDocumentUpdate;

      /** Get all the cards with all their children */
      const cards =
        await this.cardsRepository.getCardWithAllChildrenForMultipleCards(
          updatePaymentInfo.cardIds,
        );

      if (cards.length === 0) {
        throw new HttpException('No cards found', HttpStatus.NOT_FOUND);
      }

      /** Fetch the project using the first card, as we assume all cards are in the same project */
      const project = await this.projectRepository.findById(cards[0].project);

      /** Get the payment info for all the cards */
      for (const card of cards) {
        for (const child of card.flattenedChildren) {
          const childCardUpdate = this.cardPaymentService.updatePaymentInfo(
            child,
            updatePaymentInfo,
          );
          const globalUpdateAfterAutomation =
            this.automationService.handleAutomation(
              child,
              project,
              childCardUpdate[child.id],
            );
          globalUpdate.card[child.id] =
            this.datastructureManipulationService.mergeObjects(
              globalUpdate.card[child.id],
              globalUpdateAfterAutomation.card[child.id],
              childCardUpdate[child.id],
            );
          globalUpdate.project[project.id] =
            this.datastructureManipulationService.mergeObjects(
              globalUpdate.project[project.id],
              globalUpdateAfterAutomation.project[project.id],
            );
        }

        const parentCardUpdate = this.cardPaymentService.updatePaymentInfo(
          card,
          updatePaymentInfo,
        );

        const globalUpdateAfterAutomation =
          this.automationService.handleAutomation(
            card,
            project,
            parentCardUpdate[card.id],
          );
        globalUpdate.card[card.id] =
          this.datastructureManipulationService.mergeObjects(
            globalUpdate.card[card.id],
            globalUpdateAfterAutomation.card[card.id],
            parentCardUpdate[card.id],
          );

        globalUpdate.project[project.id] =
          this.datastructureManipulationService.mergeObjects(
            globalUpdate.project[project.id],
            globalUpdateAfterAutomation.project[project.id],
          );
      }

      // /** Mongo only returns an acknowledgment on bulk write and not the updated records itself */
      const cardUpdateAcknowledgment =
        await this.cardsRepository.bundleUpdatesAndExecute(globalUpdate.card);

      const projectUpdateAcknowledgment =
        await this.projectRepository.bundleUpdatesAndExecute(
          globalUpdate.project,
        );

      return await this.projectService.getDetailedProject(project.id);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed updating payment info',
        error.message,
      );
    }
  }
}

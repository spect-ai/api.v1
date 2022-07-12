import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
import { GlobalDocumentUpdate } from 'src/common/types/update.type';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { MappedProject } from 'src/project/types/types';
import { RequestProvider } from 'src/users/user.provider';
import { ActionService } from './actions.service';
import { ActivityResolver } from './activity.resolver';
import { CardsRepository } from './cards.repository';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { Card } from './model/card.model';
import { MappedCard } from './types/types';

@Injectable()
export class ResponseBuilder {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly activityResolver: ActivityResolver,
    private readonly dataStructureManipulationService: DataStructureManipulationService,
    private readonly actionService: ActionService,
  ) {}

  resolveApplicationView(card: Card): Card {
    /** Do nothing if card is not bounty, otherwise add the applicant's application
     * Cases:
     * 1. Card is not bounty -> do nothing
     * 2. User is not logged in -> dont return any application
     * 3. Application field is null since no one submitted an application -> do nothing
     * 4. User is potential applicant -> return application if it exists, otherwise dont return any application
     * 5. User is steward -> do nothing
     */
    if (card.type !== 'Bounty') return card;
    else if (!this.requestProvider.user)
      return {
        ...card,
        application: {},
        applicationOrder: [],
      };
    else if (!card.application) return card;
    else if (this.actionService.canApply(card, this.requestProvider.user.id)) {
      for (const [applicationId, application] of Object.entries(
        card.application,
      )) {
        if (application.user?.toString() === this.requestProvider.user.id) {
          console.log('adding application');
          return {
            ...card,
            application: {
              [applicationId]: application,
            },
            applicationOrder: [applicationId],
          };
        }
      }
      return {
        ...card,
        application: {},
        applicationOrder: [],
      };
    }
    return card;
  }

  async enrichResponse(card: Card): Promise<DetailedCardResponseDto> {
    /** This function should contain everything added to the response for the frontend, to prevent
     * multiple functions needing to be updated seperately for a new item
     */
    card = await this.enrichActivity(card);
    card = this.resolveApplicationView(card);
    console.log(card.application);

    const cardProject = card.project as unknown as Project;
    const res = {
      ...card,
      project: {
        ...cardProject,
        cards: this.dataStructureManipulationService.objectify(
          cardProject.cards,
          'id',
        ),
      },
    } as DetailedCardResponseDto;
    console.log(res);
    return res;
  }

  async enrichActivity(card: Card): Promise<Card> {
    card = await this.activityResolver.resolveActivities(card);
    card.activity = card.activity.reverse();
    return card;
  }
}

@Injectable()
export class CommonUtility {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly responseBuilder: ResponseBuilder,
    private readonly cardsRepository: CardsRepository,
    private readonly projectRepository: ProjectsRepository,
    private readonly datastructureManipulationService: DataStructureManipulationService,
  ) {}

  async mergeExecuteAndReturn(
    cardId: string,
    projectId: string,
    globalUpdate: GlobalDocumentUpdate,
    globalUpdateAfterAutomation: GlobalDocumentUpdate,
    cardUpdate: MappedCard,
    projectUpdate?: MappedProject,
  ) {
    globalUpdate.project[projectId] =
      this.datastructureManipulationService.mergeObjects(
        globalUpdate.project[projectId],
        globalUpdateAfterAutomation.project[projectId],
      ) as MappedProject;

    globalUpdate.card[cardId] =
      this.datastructureManipulationService.mergeObjects(
        globalUpdate.card[cardId],
        globalUpdateAfterAutomation.card[cardId],
        cardUpdate[cardId],
      ) as MappedCard;

    const acknowledgment = await this.cardsRepository.bundleUpdatesAndExecute(
      globalUpdate.card,
    );

    const projectUpdateAcknowledgment =
      await this.projectRepository.bundleUpdatesAndExecute(
        globalUpdate.project,
      );

    const resultingCard =
      await this.cardsRepository.getCardWithPopulatedReferences(cardId);
    return this.responseBuilder.enrichResponse(resultingCard);
  }
}

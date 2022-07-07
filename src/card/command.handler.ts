import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AutomationService } from 'src/automation/automation.service';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
import { CardsProjectService } from 'src/project/cards.project.service';
import { ReorderCardReqestDto } from 'src/project/dto/reorder-card-request.dto';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { ProjectService } from 'src/project/project.service';
import { RequestProvider } from 'src/users/user.provider';
import { ActivityBuilder } from './activity.builder';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { UpdateCardRequestDto } from './dto/update-card-request.dto';
import { ResponseBuilder } from './response.builder';
import { CardValidationService } from './validation.cards.service';
import mongodb from 'mongodb';
import { GlobalDocumentUpdate } from 'src/common/types/update.type';
import { MappedCard } from './types/types';
import { MappedProject } from 'src/project/types/types';

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

      const cardUpdate = this.cardsService.updateNew(
        card,
        project,
        updateCardDto,
      );
      globalUpdate.card = {
        ...globalUpdate.card,
        ...cardUpdate,
      };

      console.log(`before handleAutomation`);

      const globalUpdateAfterAutomation =
        this.automationService.handleAutomation(card, project, updateCardDto);

      console.log(`before collate globalUpdate`);
      console.log(globalUpdate);

      console.log(`before collate globalUpdateAfterAutomation`);
      console.log(globalUpdateAfterAutomation);

      globalUpdate.project =
        this.datastructureManipulationService.collateifyObjectOfObjects(
          globalUpdate.project,
          globalUpdateAfterAutomation.project,
        ) as MappedProject;

      globalUpdate.card =
        this.datastructureManipulationService.collateifyObjectOfObjects(
          globalUpdate.card,
          globalUpdateAfterAutomation.card,
        ) as MappedCard;

      console.log(`after collate`);

      if (updateCardDto.columnId || updateCardDto.cardIndex) {
        const projectUpdate = this.cardsProjectService.reorderCardNew(
          project,
          id,
          {
            destinationColumnId: updateCardDto.columnId
              ? updateCardDto.columnId
              : card.columnId,
            destinationCardIndex: updateCardDto.cardIndex
              ? updateCardDto.cardIndex
              : 0,
          } as ReorderCardReqestDto,
        );

        globalUpdate.project =
          this.datastructureManipulationService.collateifyObjectOfObjects(
            globalUpdate.project,
            projectUpdate,
          ) as MappedProject;
      }

      console.log(`globalUpdate122`);

      console.log(globalUpdate);
      const updatedCard = await this.cardsRepository.update(
        globalUpdate.card[id],
      );

      if (globalUpdate.project.hasOwnProperty(project.id)) {
        const updatedProject = await this.projectRepository.update(
          globalUpdate.project[project.id],
        );
      }

      const resultingCard =
        await this.cardsRepository.getCardWithPopulatedReferences(id);
      return this.responseBuilder.enrichResponse(resultingCard);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed card update',
        error.message,
      );
    }
  }
}

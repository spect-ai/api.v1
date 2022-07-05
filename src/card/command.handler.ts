import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
  ) {}

  async update(
    id: string,
    updateCardDto: UpdateCardRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id).populate('project');
      this.validationService.validateCardExists(card);
      const project = card.project as unknown as Project;

      const cardUpdateQuery = this.cardsService.updateNew(
        card,
        project,
        updateCardDto,
      );

      const cardUpdateAcknowledgement = await this.cardsRepository.bulkWrite([
        cardUpdateQuery,
      ]);
      console.log(cardUpdateAcknowledgement);
      if (cardUpdateAcknowledgement.hasWriteErrors()) {
        throw new InternalServerErrorException('Card update failed');
      }

      if (updateCardDto.columnId || updateCardDto.cardIndex) {
        const projectUpdateQuery = this.cardsProjectService.reorderCardNew(
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
        console.log(projectUpdateQuery);
        const projectUpdateAcknowledgement =
          await this.projectRepository.bulkWrite([projectUpdateQuery]);

        console.log(projectUpdateAcknowledgement);
        if (projectUpdateAcknowledgement.hasWriteErrors()) {
          throw new InternalServerErrorException(
            'Project update during updating card failed',
          );
        }
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

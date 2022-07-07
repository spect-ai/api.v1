import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CardsRepository } from 'src/card/cards.repository';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { ReorderCardReqestDto } from './dto/reorder-card-request.dto';
import { Project } from './model/project.model';
import { ProjectsRepository } from './project.repository';
import { CardLoc, MappedProject } from './types/types';

@Injectable()
export class CardsProjectService {
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly cardRepository: CardsRepository,
    private readonly datastructureManipulationService: DataStructureManipulationService,
  ) {}

  projectPopulatedWithCardDetails(
    project: Project,
  ): DetailedProjectResponseDto {
    return {
      ...project,
      cards: this.datastructureManipulationService.objectify(
        project.cards,
        'id',
      ),
    };
  }

  async addCardToProject(
    projectId: string,
    columnId: string,
    cardId: string,
    addInFirstColumnIfColumnDoesntExist = true,
  ): Promise<DetailedProjectResponseDto> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }

    if (
      !project.columnDetails[columnId] ||
      !project.columnOrder.includes(columnId)
    ) {
      if (addInFirstColumnIfColumnDoesntExist) {
        if (project.columnOrder.length === 0) {
          throw new HttpException(
            'Project doesnt have a column',
            HttpStatus.NOT_FOUND,
          );
        }
        columnId = project.columnOrder[0];
      } else throw new HttpException('Column not found', HttpStatus.NOT_FOUND);
    }

    const updatedProject =
      await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
        projectId.toString(),
        {
          ...project,
          cards: [...project.cards, cardId],
          columnDetails: {
            ...project.columnDetails,
            [columnId]: {
              ...project.columnDetails[columnId],
              cards: [
                cardId.toString(),
                ...project.columnDetails[columnId].cards,
              ],
            },
          },
        },
      );
    return this.projectPopulatedWithCardDetails(updatedProject);
  }

  findCardLocationInProject(project: Project, cardId: string): CardLoc {
    const cardLoc: CardLoc = {} as CardLoc;

    for (const columnId in project.columnDetails) {
      const column = project.columnDetails[columnId];
      const cardIndex = column.cards.indexOf(cardId);
      if (cardIndex > -1) {
        cardLoc.columnId = columnId;
        cardLoc.cardIndex = cardIndex;
        break;
      }
    }
    return cardLoc;
  }

  reorderCardNew(
    project: Project,
    cardId: string,
    destinationCardLoc: ReorderCardReqestDto,
  ): MappedProject {
    // Find where the card is in the project now
    const sourceCardLoc = this.findCardLocationInProject(project, cardId);
    if (!sourceCardLoc.columnId) {
      throw new HttpException('Card not found', HttpStatus.NOT_FOUND);
    }
    // Get the destination card index based on the input
    let destinationCardIndex: number;
    if (destinationCardLoc.destinationCardIndex === 'end') {
      destinationCardIndex =
        project.columnDetails[destinationCardLoc.destinationColumnId].cards
          .length;
    } else destinationCardIndex = destinationCardLoc.destinationCardIndex;

    // In case destination card index is not valid, throw error
    const columnDetails = project.columnDetails;
    if (
      destinationCardIndex < 0 ||
      destinationCardIndex -
        columnDetails[destinationCardLoc.destinationColumnId].cards.length >
        0
    ) {
      throw new HttpException(
        'Invalid destination card index',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update the card location in the project
    columnDetails[sourceCardLoc.columnId].cards.splice(
      sourceCardLoc.cardIndex,
      1,
    );

    columnDetails[destinationCardLoc.destinationColumnId].cards.splice(
      destinationCardIndex,
      0,
      cardId,
    );

    columnDetails[sourceCardLoc.columnId] = {
      ...columnDetails[sourceCardLoc.columnId],
      cards: columnDetails[sourceCardLoc.columnId].cards,
    };

    columnDetails[destinationCardLoc.destinationColumnId] = {
      ...columnDetails[destinationCardLoc.destinationColumnId],
      cards: columnDetails[destinationCardLoc.destinationColumnId].cards,
    };

    return {
      [project.id]: {
        ...project,
        columnDetails,
      },
    };
  }

  async removeMultipleCardsFromProject(
    projectId: string,
    cardIds: string[],
  ): Promise<DetailedProjectResponseDto> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
    // Remove Card from column
    const columnDetails = project.columnDetails;
    for (const cardId of cardIds) {
      console.log(cardId);

      const sourceCardLoc = this.findCardLocationInProject(project, cardId);
      console.log(sourceCardLoc);
      columnDetails[sourceCardLoc.columnId].cards.splice(
        sourceCardLoc.cardIndex,
        1,
      );
    }

    // Remove card from project
    const cards = project.cards.map((card) => card.toString());

    for (const cardId of cardIds) {
      const cardIndex = cards.indexOf(cardId);
      cards.splice(cardIndex, 1);
    }

    project.cards = cards;

    // Update project
    const updatedProject =
      await this.projectRepository.updateProjectAndReturnWithPopulatedReferences(
        projectId.toString(),
        {
          ...project,
          cards: project.cards,
          columnDetails: columnDetails,
        },
      );
    return this.projectPopulatedWithCardDetails(updatedProject);
  }
}

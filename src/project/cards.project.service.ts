import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Card } from 'src/card/model/card.model';
import { CommonTools } from 'src/common/common.service';
import { MappedPartialItem } from 'src/common/interfaces';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { ReorderCardReqestDto } from './dto/reorder-card-request.dto';
import { Project } from './model/project.model';
import { ProjectsRepository } from './project.repository';
import { CardLoc, MappedProject } from './types/types';

@Injectable()
export class CardsProjectService {
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly commonTools: CommonTools,
  ) {}

  projectPopulatedWithCardDetails(
    project: Project,
  ): DetailedProjectResponseDto {
    const cards = {};
    for (const populatedCard of project.cards) {
      const card = populatedCard as unknown as Card;
      cards[card.id] = card;
      if (!card.parent) {
        cards[card.id].isParent = true;
      } else {
        cards[card.id].isParent = false;
      }
    }

    return {
      ...project,
      cards,
    };
  }

  addCardsToProject(project: Project, cards: Card[]): MappedProject {
    const cardIds = [];
    const columnDetails = { ...project.columnDetails };
    for (const card of cards) {
      cardIds.push(card._id);
      columnDetails[card.columnId].cards = [
        card._id.toString(),
        ...columnDetails[card.columnId].cards,
      ];
    }

    return {
      [project.id]: {
        cards: [...cardIds, ...project.cards],
        columnDetails: columnDetails,
      },
    };
  }

  addCardToProjectNew(
    project: Project,
    columnId: string,
    cardId: string,
    addInFirstColumnIfColumnDoesntExist = true,
  ): MappedProject {
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
    return {
      [project.id]: {
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
  ): MappedPartialItem<Project> {
    // Find where the card is in the project now
    const sourceCardLoc = this.findCardLocationInProject(project, cardId);
    if (!sourceCardLoc.columnId) {
      console.log(`Card ${cardId} not found in project`);
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
        columnDetails,
      },
    };
  }

  reorderCard(
    project: Project,
    cardId: string,
    destinationCardLoc: ReorderCardReqestDto,
  ): MappedProject {
    // Find where the card is in the project now
    const sourceCardLoc = this.findCardLocationInProject(project, cardId);
    if (!sourceCardLoc.columnId) {
      console.log(`Card ${cardId} not found in project`);
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
      const sourceCardLoc = this.findCardLocationInProject(project, cardId);
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

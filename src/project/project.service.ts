import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { CardsRepository } from 'src/card/cards.repository';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { SlugService } from 'src/common/slug.service';
import { TemplatesRepository } from 'src/template/tempates.repository';
import { ColumnDetailsDto } from './dto/column-details.dto';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { ReorderCardReqestDto } from './dto/reorder-card-request.dto';
import { UpdateColumnRequestDto } from './dto/update-column.dto';
import { UpdateProjectRequestDto } from './dto/update-project-request.dto';
import { ColumnDetailsModel } from './model/columnDetails.model';
import { Project } from './model/project.model';
import { ProjectsRepository } from './project.repository';
import { CardLoc } from './types/card-loc.type';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly circlesRepository: CirclesRepository,
    private readonly slugService: SlugService,
    private readonly templateRepository: TemplatesRepository,
    private readonly cardRepository: CardsRepository,
  ) {}

  async getDetailedProject(id: string): Promise<DetailedProjectResponseDto> {
    const project =
      await this.projectRepository.getProjectWithPopulatedReferences(id);
    return project;
  }

  async getDetailedProjectBySlug(
    slug: string,
  ): Promise<DetailedProjectResponseDto> {
    const project =
      await this.projectRepository.getProjectWithPopulatedReferencesBySlug(
        slug,
      );
    return project;
  }

  async create(createProjectDto: CreateProjectRequestDto): Promise<Project> {
    try {
      const slug = await this.slugService.generateUniqueSlug(
        createProjectDto.name,
        this.projectRepository,
      );

      let parentCircle: Circle;
      if (createProjectDto.circleId) {
        parentCircle =
          await this.circlesRepository.getCircleWithUnpopulatedReferences(
            createProjectDto.circleId,
          );
      }
      if (createProjectDto.fromTemplateId) {
        const template = await this.templateRepository.getTemplate(
          createProjectDto.fromTemplateId,
        );
        const data = template.projectData;
        if (
          Object.keys(data).length > 0 &&
          'columnOrder' in data &&
          'columnDetails' in data
        ) {
          createProjectDto.columnOrder = data.columnOrder;
          createProjectDto.columnDetails =
            data?.columnDetails as ColumnDetailsDto;
        }
      }

      const createdProject = await this.projectRepository.create({
        ...createProjectDto,
        slug: slug,
        parents: [parentCircle._id],
      });

      if (parentCircle?.id) {
        await this.circlesRepository.updateById(parentCircle.id as string, {
          ...parentCircle,
          projects: [...parentCircle.projects, createdProject],
        });
      }

      return createdProject;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed circle creation',
        error.message,
      );
    }
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectRequestDto,
  ): Promise<Project> {
    try {
      const updatedProject = await this.projectRepository.updateById(
        id,
        updateProjectDto,
      );
      return updatedProject;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed project update',
        error.message,
      );
    }
  }

  async deleteColumn(id: string, columnId: string): Promise<Project> {
    try {
      const project = await this.projectRepository.findById(id);
      if (!project) {
        throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
      }

      const columnOrder = project.columnOrder;
      const columnDetails = project.columnDetails;
      const columnIndex = project.columnOrder.indexOf(columnId, 0);
      if (columnIndex > -1) {
        columnOrder.splice(columnIndex, 1);
      }
      let cards = [] as ObjectId[];
      console.log(project);
      if (columnId in columnDetails) {
        cards = project.columnDetails[columnId].cards;
        delete columnDetails[columnId];
      }

      await this.cardRepository.updateByFilter(
        {
          _id: {
            $in: cards,
          },
        },
        {
          archived: true,
          active: false,
        },
      );

      return await this.projectRepository.updateById(id, {
        columnOrder,
        columnDetails,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed column deletion',
        error.message,
      );
    }
  }

  async updateColumnDetails(
    id: string,
    columnId: string,
    updateColumnDto: UpdateColumnRequestDto,
  ): Promise<Project> {
    try {
      const project = await this.projectRepository.findById(id);
      if (!project) {
        throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
      }
      if (!project.columnDetails[columnId]) {
        throw new HttpException('Column not found', HttpStatus.NOT_FOUND);
      }
      const columnDetails = project.columnDetails;
      columnDetails[columnId] = {
        ...columnDetails[columnId],
        ...updateColumnDto,
      };
      return await this.projectRepository.updateById(id, {
        columnDetails,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed column renaming',
        error.message,
      );
    }
  }

  async delete(id: string): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
    return await this.projectRepository.deleteById(id);
  }

  async addCardToProject(
    projectId: ObjectId,
    columnId: string,
    cardSlug: string,
    cardId: ObjectId,
  ): Promise<Project> {
    const project = await this.projectRepository.findByObjectId(projectId);
    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }

    if (
      !project.columnDetails[columnId] ||
      !project.columnOrder.includes(columnId)
    ) {
      throw new HttpException('Column not found', HttpStatus.NOT_FOUND);
    }

    return await this.projectRepository
      .updateById(projectId.toString(), {
        ...project,
        cards: {
          ...project.cards,
          [cardSlug]: cardId,
        },
        columnDetails: {
          ...project.columnDetails,
          [columnId]: {
            ...project.columnDetails[columnId],
            cards: [...project.columnDetails[columnId].cards, cardSlug],
          },
        },
      })
      .populate('cards.$*');
  }

  findCardLocationInProject(project: Project, cardId: ObjectId): CardLoc {
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

  async reorderCard(
    projectId: ObjectId,
    cardId: ObjectId,
    reorderCardDto: ReorderCardReqestDto,
    updateColumnIdInCard = false,
  ): Promise<Project> {
    const project = await this.projectRepository.findByObjectId(projectId);
    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
    const sourceCardLoc = this.findCardLocationInProject(project, cardId);
    if (!sourceCardLoc.columnId) {
      throw new HttpException('Card not found', HttpStatus.NOT_FOUND);
    }
    const columnDetails = project.columnDetails;
    if (
      reorderCardDto.destinationCardIndex < 0 ||
      reorderCardDto.destinationCardIndex -
        columnDetails[reorderCardDto.destinationColumnId].cards.length >
        0
    ) {
      throw new HttpException(
        'Invalid destination card index',
        HttpStatus.BAD_REQUEST,
      );
    }

    columnDetails[sourceCardLoc.columnId] = {
      ...columnDetails[sourceCardLoc.columnId],
      cards: columnDetails[sourceCardLoc.columnId].cards.splice(
        sourceCardLoc.cardIndex,
        1,
      ),
    };

    columnDetails[reorderCardDto.destinationColumnId] = {
      ...columnDetails[reorderCardDto.destinationColumnId],
      cards: columnDetails[reorderCardDto.destinationColumnId].cards.splice(
        reorderCardDto.destinationCardIndex,
        0,
        cardId,
      ),
    };

    if (updateColumnIdInCard) {
      await this.cardRepository.updateById(cardId.toString(), {
        columnId: reorderCardDto.destinationColumnId,
      });
    }

    return await this.projectRepository.updateById(projectId.toString(), {
      columnDetails,
    });
  }
}

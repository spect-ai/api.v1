import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { CirclesRepository } from 'src/circle/circles.repository';
import { ActivityBuilder } from 'src/common/activity.builder';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { ProjectService } from 'src/project/project.service';
import { RequestProvider } from 'src/users/user.provider';
import { CardsRepository } from './cards.repository';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { UpdateCardRequestDto } from './dto/update-card-request.dto';
import { Card } from './model/card.model';

@Injectable()
export class CardsService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly activityBuilder: ActivityBuilder,
    private readonly circleRepository: CirclesRepository,
    private readonly projectService: ProjectService,
  ) {}

  async create(
    createCardDto: CreateCardRequestDto,
  ): Promise<DetailedProjectResponseDto> {
    try {
      const activity = this.activityBuilder.getActivity(
        this.requestProvider,
        createCardDto,
        null,
      );
      const defaultPayment = await this.circleRepository.getDefaultPayment(
        createCardDto.circle,
      );
      const cardNum = await this.cardsRepository.count({
        project: createCardDto.project,
      });

      const card = await this.cardsRepository.create({
        ...createCardDto,
        activity: activity,
        reward: defaultPayment,
        slug: cardNum.toString(),
        creator: this.requestProvider.user._id,
      });
      const project = await this.projectService.addCardToProject(
        createCardDto.project,
        createCardDto.columnId,
        card.slug,
        card._id,
      );
      return project;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed card creation',
        error.message,
      );
    }
  }

  async getDetailedCard(id: string): Promise<DetailedCardResponseDto> {
    const card = await this.cardsRepository.getCardWithPopulatedReferences(id);
    return card;
  }

  async getDetailedCardBySlug(
    project: ObjectId,
    slug: string,
  ): Promise<DetailedCardResponseDto> {
    const card =
      await this.cardsRepository.getCardWithPopulatedReferencesBySlug(
        project,
        slug,
      );
    return card;
  }

  async update(
    id: string,
    updateCardDto: UpdateCardRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const updatedCircle = await this.cardsRepository.updateById(
        id,
        updateCardDto,
      );
      return updatedCircle;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed card update',
        error.message,
      );
    }
  }

  async delete(id: string): Promise<Card> {
    const card = await this.cardsRepository.findById(id);
    if (!card) {
      throw new HttpException('Card not found', HttpStatus.NOT_FOUND);
    }
    return await this.cardsRepository.deleteById(id);
  }
}

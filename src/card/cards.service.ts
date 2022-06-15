import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CirclesRepository } from 'src/circle/circles.repository';
import { ActivityBuilder } from 'src/common/activity.builder';
import { ProjectService } from 'src/project/project.service';
import { UserProvider } from 'src/users/user.provider';
import { CardsRepository } from './cards.repository';
import { CreateCardRequestDto } from './dto/create-card-request.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { UpdateCardRequestDto } from './dto/update-card-request.dto';
import { Card } from './model/card.model';

@Injectable()
export class CardsService {
  constructor(
    private readonly userProvider: UserProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly activityBuilder: ActivityBuilder,
    private readonly projectService: ProjectService,
    private readonly circleRepository: CirclesRepository,
  ) {}

  async create(
    createCardDto: CreateCardRequestDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const activity = this.activityBuilder.getActivity(
        this.userProvider,
        createCardDto,
        null,
      );
      const defaultPayment = await this.circleRepository.getDefaultPayment(
        createCardDto.circleId,
      );
      const cardNum = await this.cardsRepository.count({
        project: createCardDto.project,
      });

      return await this.cardsRepository.create({
        ...createCardDto,
        activity: activity,
        reward: defaultPayment,
        slug: cardNum.toString(),
      });
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

  async getDetailedCardBySlug(slug: string): Promise<DetailedCardResponseDto> {
    const card =
      await this.cardsRepository.getCardWithPopulatedReferencesBySlug(slug);
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

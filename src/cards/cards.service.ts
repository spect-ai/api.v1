import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
  ) {}

  async create(
    createCardDto: CreateCardRequestDto,
  ): Promise<DetailedCardResponseDto> {
    return await this.cardsRepository.create(createCardDto);
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
    const circle = await this.cardsRepository.findById(id);
    if (!circle) {
      throw new HttpException('Card not found', HttpStatus.NOT_FOUND);
    }
    return await this.cardsRepository.deleteById(id);
  }
}

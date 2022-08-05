import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Activity } from 'src/common/types/activity.type';
import { RequestProvider } from 'src/users/user.provider';
import { v4 as uuidv4 } from 'uuid';
import { CardsRepository } from './cards.repository';
import { AddCommentDto, UpdateCommentDto } from './dto/comment-body.dto';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { ResponseBuilder } from './response.builder';
import { CardValidationService } from './validation.cards.service';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly validationService: CardValidationService,
    private readonly responseBuilder: ResponseBuilder,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('CommentService');
  }

  async addComment(
    id: string,
    addCommentDto: AddCommentDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validationService.validateCardExists(card);

      const commitId = uuidv4();
      card.activity = [
        ...card.activity,
        {
          commitId,
          actorId: this.requestProvider.user.id,
          content: addCommentDto.comment,
          timestamp: new Date(),
          comment: true,
        } as Activity,
      ];

      const updatedCard =
        await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
          id,
          {
            activity: card.activity,
          },
        );
      return await this.responseBuilder.enrichResponse(updatedCard);
    } catch (error) {
      this.logger.logError(
        `Failed while adding comment with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed adding comment',
        error.message,
      );
    }
  }

  async updateComment(
    id: string,
    commitId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validationService.validateCardExists(card);

      const commentIndex = card.activity.findIndex((activity) => {
        return activity.commitId === commitId;
      });
      this.validationService.validateCommentCanBeUpdated(card, commentIndex);

      card.activity[commentIndex].content = updateCommentDto.comment;

      const updatedCard =
        await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
          id,
          {
            activity: card.activity,
          },
        );
      return await this.responseBuilder.enrichResponse(updatedCard);
    } catch (error) {
      this.logger.logError(
        `Failed while updating comment with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed updating comment',
        error.message,
      );
    }
  }

  async deleteComment(
    id: string,
    commitId: string,
  ): Promise<DetailedCardResponseDto> {
    try {
      const card = await this.cardsRepository.findById(id);
      this.validationService.validateCardExists(card);

      const commentIndex = card.activity.findIndex((activity) => {
        return activity.commitId === commitId;
      });
      this.validationService.validateCommentCanBeUpdated(card, commentIndex);

      card.activity.splice(commentIndex, 1);

      const updatedCard =
        await this.cardsRepository.updateCardAndReturnWithPopulatedReferences(
          id,
          {
            activity: card.activity,
          },
        );
      return await this.responseBuilder.enrichResponse(updatedCard);
    } catch (error) {
      this.logger.logError(
        `Failed while deleting comment with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed while deleting comment',
        error.message,
      );
    }
  }
}

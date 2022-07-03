import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RequestProvider } from 'src/users/user.provider';
import { Card } from './model/card.model';

@Injectable()
export class CardValidationService {
  constructor(private readonly requestProvider: RequestProvider) {}

  validateCardExists(card: Card) {
    if (!card) {
      throw new HttpException('Card not found', HttpStatus.NOT_FOUND);
    }
  }

  validateCardThreadExists(card: Card, threadId: string) {
    if (!card.workThreads[threadId]) {
      throw new HttpException('Work thread not found', HttpStatus.NOT_FOUND);
    }
  }

  validateCommentCanBeUpdated(card: Card, commentIndex: number) {
    if (commentIndex === -1) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }
    if (card.activity[commentIndex].actorId !== this.requestProvider.user.id) {
      throw new HttpException(
        'You are not authorized to update this comment',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (!card.activity[commentIndex].comment) {
      throw new HttpException('Not a comment', HttpStatus.NOT_FOUND);
    }
  }

  validateApplicationExists(card: Card, applicationId: string) {
    if (!card.application[applicationId]) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }
  }

  validateCallerIsOwner(card: Card, applicationId: string) {
    if (
      card.application[applicationId].user.toString() !==
      this.requestProvider.user.id
    ) {
      throw new HttpException(
        'Caller didnt submit this application',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  validateUserHasntSubmittedApplicaiton(card: Card) {
    if (!card.application) return;
    for (const [applicationId, application] of Object.entries(
      card.application,
    )) {
      if (application.user?.toString() === this.requestProvider.user.id) {
        throw new HttpException(
          'User has already submitted application',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RequestProvider } from 'src/users/user.provider';
import { ActivityResolver } from './activity.resolver';
import { DetailedCardResponseDto } from './dto/detailed-card-response-dto';
import { Card } from './model/card.model';

@Injectable()
export class ResponseBuilder {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly activityResolver: ActivityResolver,
  ) {}

  resolveApplicationView(card: Card): DetailedCardResponseDto {
    /** Do nothing if card is not bounty, otherwise add the applicant's application
     *
     * TODO: Check if caller is steward, if not, filter out the rest of the applications
     */
    if (card.type !== 'Bounty') return card;
    else if (!this.requestProvider.user) return card;
    else {
      for (const [applicationId, application] of Object.entries(
        card.application,
      )) {
        if (application.user.toString() === this.requestProvider.user.id) {
          return {
            ...card,
            myApplication: application,
          };
        }
      }
    }
    return card;
  }

  async enrichResponse(card: Card) {
    /** This function should contain everything added to the response for the frontend, to prevent
     * multiple functions needing to be updated seperately for a new item
     */
    card = await this.enrichActivity(card);
    return this.resolveApplicationView(card);
  }

  async enrichActivity(card: Card) {
    card = await this.activityResolver.resolveActivities(card);
    card.activity = card.activity.reverse();
    return card;
  }
}

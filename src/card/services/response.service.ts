import { Injectable } from '@nestjs/common';
import { CommonTools } from 'src/common/common.service';
import { Project } from 'src/project/model/project.model';
import { DetailedCardResponseDto } from '../dto/detailed-card-response-dto';
import { Card } from '../model/card.model';
import { ActivityResolver } from './activity-resolver.service';

@Injectable()
export class ResponseBuilder {
  constructor(
    private readonly activityResolver: ActivityResolver,
    private readonly commonTools: CommonTools,
  ) {}

  resolveApplicationView(card: Card, caller?: string): Card {
    /** Do nothing if card is not bounty, otherwise add the applicant's application
     * Cases:
     * 1. Card is not bounty -> do nothing
     * 2. User is not logged in -> dont return any application
     * 3. Application field is null since no one submitted an application -> do nothing
     * 4. User is potential applicant -> return application if it exists, otherwise dont return any application
     * 5. User is steward -> do nothing
     */
    if (card.type !== 'Bounty') return card;
    else if (!caller)
      return {
        ...card,
        application: {},
        applicationOrder: [],
      };
    else if (!card.application) return card;
    else if (!card.reviewer?.includes(caller)) {
      for (const [applicationId, application] of Object.entries(
        card.application,
      )) {
        if (application.user?.toString() === caller) {
          console.log('adding application');
          return {
            ...card,
            application: {
              [applicationId]: application,
            },
            applicationOrder: [applicationId],
          };
        }
      }
      return {
        ...card,
        application: {},
        applicationOrder: [],
      };
    }
    return card;
  }

  async enrichResponse(
    card: Card,
    caller?: string,
  ): Promise<DetailedCardResponseDto> {
    /** This function should contain everything added to the response for the frontend, to prevent
     * multiple functions needing to be updated seperately for a new item
     */
    card = await this.enrichActivity(card);
    card = this.resolveApplicationView(card, caller);

    const cardProject = card.project as unknown as Project;
    const res = {
      ...card,
      project: {
        ...cardProject,
        cards: cardProject.cards
          ? this.commonTools.objectify(cardProject.cards, 'id')
          : {},
      },
    } as DetailedCardResponseDto;

    return res;
  }

  async enrichActivity(card: Card): Promise<Card> {
    card = await this.activityResolver.resolveActivities(card);
    card.activity = card.activity.reverse();
    return card;
  }
}

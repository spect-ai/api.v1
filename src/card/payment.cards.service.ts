import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ActivityBuilder } from 'src/card/activity.builder';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
import { CardsProjectService } from 'src/project/cards.project.service';
import { Project } from 'src/project/model/project.model';
import { ProjectService } from 'src/project/project.service';
import { RequestProvider } from 'src/users/user.provider';
import { CardsRepository } from './cards.repository';
import { AggregatedFlattenedPaymentInfo } from './dto/payment-info-response.dto';
import { UpdatePaymentInfoDto } from './dto/update-payment-info.dto';
import { Card } from './model/card.model';
import { ResponseBuilder } from './response.builder';
import { MappedCard } from './types/types';
import { CardValidationService } from './validation.cards.service';

@Injectable()
export class CardsPaymentService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly activityBuilder: ActivityBuilder,
    private readonly projectService: ProjectService,
    private readonly cardsProjectService: CardsProjectService,
    private readonly datastructureManipulationService: DataStructureManipulationService,
    private readonly validationService: CardValidationService,
    private readonly responseBuilder: ResponseBuilder,
  ) {}

  getDividedRewards(value: number, members: string[]) {
    const rewardValues = [];
    for (let i = 0; i < members.length; i++) {
      // Distribution streategy => First assignee receives the entire amount. Can be customized in the future
      if (i === 0) {
        rewardValues.push(value);
      } else {
        rewardValues.push(0);
      }
    }
    return rewardValues;
  }

  async aggregatePaymentInfo(
    cardIds: string[],
    chainId: string,
  ): Promise<AggregatedFlattenedPaymentInfo> {
    const cards = await this.cardsRepository.findAll({
      _id: { $in: cardIds },
      'reward.chain.chainId': chainId,
    });
    const aggregatedPaymentInfo = {
      approval: { tokenAddresses: [], values: [] },
      currency: { userIds: [], values: [] },
      tokens: { tokenAddresses: [], userIds: [], values: [] },
    } as AggregatedFlattenedPaymentInfo;

    /*
     * Aggregate the reward values and group them by token address to get the minimum amount
     * that needs to be approved by user to be able to make payment
     */
    let aggregatedRewardValuesGroupedByToken = {};
    for (const card of cards) {
      if (card.reward.token.address !== '0x0')
        aggregatedRewardValuesGroupedByToken =
          this.datastructureManipulationService.setOrAggregateObjectKey(
            aggregatedRewardValuesGroupedByToken,
            card.reward.token.address,
            card.reward.value,
          );
    }
    aggregatedPaymentInfo.approval.tokenAddresses = Object.keys(
      aggregatedRewardValuesGroupedByToken,
    );
    aggregatedPaymentInfo.approval.values = Object.values(
      aggregatedRewardValuesGroupedByToken,
    );

    /*
     * Aggregate the reward values and group them by token address and assignee to get the reward share
     * each assignee gets
     */
    const paymentInfo = {};
    for (const card of cards) {
      const assignees = card.assignee;
      const reward = card.reward;
      if (reward.value > 0 && assignees.length > 0) {
        const rewardValues = this.getDividedRewards(reward.value, assignees);

        for (const [index, assignee] of assignees.entries()) {
          if (!paymentInfo.hasOwnProperty(reward.token.address)) {
            paymentInfo[reward.token.address] = {};
          }
          paymentInfo[reward.token.address] =
            this.datastructureManipulationService.setOrAggregateObjectKey(
              paymentInfo[reward.token.address],
              assignee,
              rewardValues[index],
            );
        }
      }
    }

    /*
     * Flatten the reward tokens, users and values into equal length arrays
     */
    for (const [tokenAddress, userIdToValue] of Object.entries(paymentInfo)) {
      if (tokenAddress === '0x0') {
        aggregatedPaymentInfo.currency.userIds = Object.keys(userIdToValue);
        aggregatedPaymentInfo.currency.values = Object.values(userIdToValue);
      } else {
        for (const [userId, value] of Object.entries(userIdToValue)) {
          aggregatedPaymentInfo.tokens.tokenAddresses.push(tokenAddress);
          aggregatedPaymentInfo.tokens.userIds.push(userId);
          aggregatedPaymentInfo.tokens.values.push(value);
        }
      }
    }

    return aggregatedPaymentInfo;
  }

  updatePaymentInfo(
    card: Card,
    updatePaymentInfoDto: UpdatePaymentInfoDto,
  ): MappedCard {
    const activities = this.activityBuilder.buildUpdatedCardActivity(
      {
        status: {
          active: false,
          paid: true,
          archived: false,
        },
      },
      card,
    );

    return {
      [card.id]: {
        activity: card.activity.concat(activities),
        reward: {
          ...card.reward,
          transactionHash: updatePaymentInfoDto.transactionHash,
        },
        status: {
          ...card.status,
          paid: true,
          active: false,
        },
      },
    };
  }

  // buildUpdateQuery(card: Card, updatePaymentInfoDto: UpdatePaymentInfoDto) {
  //   const activities = this.activityBuilder.buildUpdatedCardActivity(
  //     {
  //       status: {
  //         active: false,
  //         paid: true,
  //         archived: false,
  //       },
  //     },
  //     card,
  //   );

  //   return this.cardsRepository.updateOneByIdQuery(card._id, {
  //     $set: {
  //       'reward.transactionHash': updatePaymentInfoDto.transactionHash,
  //       'status.active': false,
  //       'status.paid': true,
  //     },
  //     $push: {
  //       activity: activities[0],
  //     },
  //   });
  // }

  // async updatePaymentInfoAndClose(
  //   updatePaymentInfo: UpdatePaymentInfoDto,
  // ): Promise<any> {
  //   try {
  //     if (updatePaymentInfo.cardIds.length === 0) {
  //       throw new HttpException(
  //         'Card ids cannot be empty',
  //         HttpStatus.INTERNAL_SERVER_ERROR,
  //       );
  //     }

  //     /** Get all the cards with all their children */
  //     const cards =
  //       await this.cardsRepository.getCardWithAllChildrenForMultipleCards(
  //         updatePaymentInfo.cardIds,
  //       );
  //     const projectId = cards[0].project;

  //     /** Flatten all parent cards and child cards */
  //     const queries = [];
  //     for (const card of cards) {
  //       for (const child of card.flattenedChildren) {
  //         queries.push(this.buildUpdateQuery(child, updatePaymentInfo));
  //       }
  //       queries.push(this.buildUpdateQuery(card, updatePaymentInfo));
  //     }

  //     // /** Mongo only returns an acknowledgment on bulk write and not the updated records itself */
  //     const acknowledgment = await this.cardsRepository.bulkWrite(queries);

  //     if (acknowledgment.hasWriteErrors()) {
  //       console.log(acknowledgment.getWriteErrors());
  //       throw new HttpException(
  //         'Something went wrong while updating payment info',
  //         HttpStatus.INTERNAL_SERVER_ERROR,
  //       );
  //     }
  //     return await this.projectService.getDetailedProject(projectId);
  //   } catch (error) {
  //     throw new InternalServerErrorException(
  //       'Failed updating payment info',
  //       error.message,
  //     );
  //   }
  //}
}

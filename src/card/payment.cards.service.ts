import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ActivityBuilder } from 'src/card/activity.builder';
import { CommonTools } from 'src/common/common.service';
import { CardsRepository } from './cards.repository';
import { AggregatedFlattenedPaymentInfo } from './dto/payment-info-response.dto';
import { UpdatePaymentInfoDto } from './dto/update-payment-info.dto';
import { Card } from './model/card.model';
import { MappedCard } from './types/types';
import { LoggingService } from 'src/logging/logging.service';
import { RequestProvider } from 'src/users/user.provider';

@Injectable()
export class CardsPaymentService {
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly activityBuilder: ActivityBuilder,
    private readonly commonTools: CommonTools,
    private readonly logger: LoggingService,
    private readonly requestProvider: RequestProvider,
  ) {
    logger.setContext('CardsPaymentService');
  }

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
    payForChildren = true,
  ): Promise<AggregatedFlattenedPaymentInfo> {
    try {
      let cards: Card[] = [];

      if (payForChildren) {
        const cardsWithChildren =
          await this.cardsRepository.getCardWithAllChildrenForMultipleCards(
            cardIds,
          );
        for (const card of cardsWithChildren) {
          cards.push(card);
          cards = [...cards, ...card.flattenedChildren];
        }
        //cards = cards.filter((card) => card.reward.chain?.chainId === chainId);
      } else {
        cards = await this.cardsRepository.findAll({
          _id: { $in: cardIds },
          'reward.chain.chainId': chainId,
        });
      }
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
            this.commonTools.setOrAggregateObjectKey(
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
              this.commonTools.setOrAggregateObjectKey(
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
      aggregatedPaymentInfo.chainId = chainId;
      return aggregatedPaymentInfo;
    } catch (error) {
      this.logger.logError(
        `Failed while aggregating payment info with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed while aggregating payment info',
        error.message,
      );
    }
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
}

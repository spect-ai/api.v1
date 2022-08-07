import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { CardsRepository } from 'src/card/cards.repository';
import { Card, ExtendedCard } from 'src/card/model/card.model';
import { UpdatePaymentCommand } from '../impl';
import { MappedItem, MappedPartialItem } from 'src/common/interfaces';
import { GlobalDocumentUpdate } from 'src/common/types/update.type';
import { Project } from 'src/project/model/project.model';
import { UpdatePaymentInfoDto } from 'src/card/dto/update-payment-info.dto';
import { GetMultipleCardsWithChildrenQuery } from 'src/card/queries/impl';
import { GetMultipleProjectsQuery } from 'src/project/queries/impl';
import {
  GetTriggeredAutomationForMultipleCardsQuery,
  GetTriggeredAutomationsQuery,
} from 'src/automation/queries/impl/get-triggered-automations.query';
import { CommonTools } from 'src/common/common.service';

@CommandHandler(UpdatePaymentCommand)
export class UpdatePaymentCommandHandler
  implements ICommandHandler<UpdatePaymentCommand>
{
  constructor(
    private readonly cardRepository: CardsRepository,
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
    private readonly commonTools: CommonTools,
  ) {
    this.logger.setContext('UpdatePaymentCommandHandler');
  }

  async execute(command: UpdatePaymentCommand): Promise<any> {
    try {
      console.log('UpdatePaymentCommandHandler');
      const { updatePaymentInfoDto, commit, objectify } = command;
      const cardsToUpdate = await this.queryBus.execute(
        new GetMultipleCardsWithChildrenQuery(updatePaymentInfoDto.cardIds),
      );

      if (!cardsToUpdate || cardsToUpdate.length === 0)
        throw new Error('Cards not found');

      let flattenedCards = [];
      for (const card of cardsToUpdate) {
        flattenedCards = [...flattenedCards, ...card.flattenedChildren, card];
      }
      const projectIds = cardsToUpdate.map((card) => card.project);

      const cardUpdateObj = this.getUpdatedPaymentInfo(
        cardsToUpdate,
        updatePaymentInfoDto,
      );
      const objectifiedProjects = (await this.queryBus.execute(
        new GetMultipleProjectsQuery(
          {
            _id: { $in: projectIds },
          },
          null,
          null,
          true,
        ),
      )) as MappedItem<Project>;

      const triggeredAutomations = await this.queryBus.execute(
        new GetTriggeredAutomationForMultipleCardsQuery(
          flattenedCards,
          cardUpdateObj,
          objectifiedProjects,
        ),
      );

      console.log(triggeredAutomations);
    } catch (error) {
      this.logger.error(
        `Failed updating payment info for cards with error: ${error.message}`,
        command,
      );
      throw new InternalServerErrorException(
        'Failed updating payment info for cards',
        error.message,
      );
    }
  }

  getUpdatedPaymentInfo(
    cards: ExtendedCard[],
    updatePaymentInfoDto: UpdatePaymentInfoDto,
  ): MappedPartialItem<Card> {
    const updateObj = {} as MappedPartialItem<Card>;
    for (const card of cards) {
      updateObj[card.id] = {
        //activity: card.activity.concat(activities),
        reward: {
          ...card.reward,
          transactionHash: updatePaymentInfoDto.transactionHash,
        },
        status: {
          ...card.status,
          paid: true,
          active: false,
        },
      };

      for (const childCard of card.flattenedChildren) {
        updateObj[childCard.id] = {
          ...childCard,
          status: {
            ...childCard.status,
            active: false,
          },
        };
      }
    }
    // const activities = this.activityBuilder.buildUpdatedCardActivity(
    //   {
    //     status: {
    //       active: false,
    //       paid: true,
    //       archived: false,
    //     },
    //   },
    //   card,
    // );

    return updateObj;
  }
}

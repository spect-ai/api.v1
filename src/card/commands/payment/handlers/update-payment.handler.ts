import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AutomationService } from 'src/automation/automation.service';
import { CardsRepository } from 'src/card/cards.repository';
import { UpdateCardRequestDto } from 'src/card/dto/update-card-request.dto';
import { UpdatePaymentInfoDto } from 'src/card/dto/update-payment-info.dto';
import { CardCommandHandler } from 'src/card/handlers/update.command.handler';
import { Card } from 'src/card/model/card.model';
import { CardsPaymentService } from 'src/card/payment.cards.service';
import { CommonTools } from 'src/common/common.service';
import { MappedItem } from 'src/common/interfaces';
import { Activity } from 'src/common/types/activity.type';
import { GlobalDocumentUpdate } from 'src/common/types/update.type';
import { LoggingService } from 'src/logging/logging.service';
import { Project } from 'src/project/model/project.model';
import { ProjectsRepository } from 'src/project/project.repository';
import { UpdatePaymentCommand } from '../impl';

@CommandHandler(UpdatePaymentCommand)
export class UpdatePaymentCommandHandler
  implements ICommandHandler<UpdatePaymentCommand>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly commonTools: CommonTools,
    private readonly logger: LoggingService,
    private readonly cardsRepository: CardsRepository,
    private readonly automationService: AutomationService,
    private readonly projectRepository: ProjectsRepository,
  ) {}

  async execute(command: UpdatePaymentCommand): Promise<void> {
    try {
      const globalUpdate = {
        card: {},
        project: {},
      } as GlobalDocumentUpdate;
      const { updatePaymentDto } = command;

      /** Get all the cards with all their children */
      const cards =
        await this.cardsRepository.getCardWithAllChildrenForMultipleCards(
          updatePaymentDto.cardIds,
        );

      if (cards.length === 0) {
        throw new HttpException('No cards found', HttpStatus.NOT_FOUND);
      }

      /** Fetch the project using the first card, as we assume all cards are in the same project */
      const project = await this.projectRepository.findById(
        cards[0].project as string,
      );

      /** Get the payment info for all the cards */
      for (const card of cards) {
        for (const child of card.flattenedChildren) {
          const childCardUpdate = this.updatePaymentInfo(
            child,
            updatePaymentDto,
          );
          const automationUpdate = this.automationService.handleAutomation(
            child,
            project,
            childCardUpdate[child.id],
          );
          globalUpdate.card[child.id] = this.commonTools.mergeObjects(
            globalUpdate.card[child.id],
            automationUpdate.card[child.id],
            childCardUpdate[child.id],
          );
          globalUpdate.project[project.id] = this.commonTools.mergeObjects(
            globalUpdate.project[project.id],
            automationUpdate.project[project.id],
          );
        }

        const parentCardUpdate = this.updatePaymentInfo(card, updatePaymentDto);

        const automationUpdate = this.automationService.handleAutomation(
          card,
          project,
          parentCardUpdate[card.id],
        );
        globalUpdate.card[card.id] = this.commonTools.mergeObjects(
          globalUpdate.card[card.id],
          automationUpdate.card[card.id],
          parentCardUpdate[card.id],
        );

        globalUpdate.project[project.id] = this.commonTools.mergeObjects(
          globalUpdate.project[project.id],
          automationUpdate.project[project.id],
        );
      }

      // /** Mongo only returns an acknowledgment on bulk write and not the updated records itself */
      const cardUpdateAcknowledgment =
        await this.cardsRepository.bundleUpdatesAndExecute(globalUpdate.card);

      const projectUpdateAcknowledgment =
        await this.projectRepository.bundleUpdatesAndExecute(
          globalUpdate.project,
        );
    } catch (error) {
      console.log(error);
    }
  }

  updatePaymentInfo(
    card: Card,
    updatePaymentInfoDto: UpdatePaymentInfoDto,
  ): MappedItem<Card> {
    // const changeLog = this.buildUpdateChangeLog(
    //   {
    //     status: {
    //       active: false,
    //       paid: true,
    //       archived: false,
    //     },
    //   },
    //   card,
    // );

    return {
      [card.id]: {
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
      },
    };
  }
}

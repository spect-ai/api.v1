import { HttpException, HttpStatus } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { AutomationService } from 'src/automation/automation.service';
import { CardsRepository } from 'src/card/cards.repository';
import { UpdatePaymentInfoDto } from 'src/card/dto/update-payment-info.dto';
import { Card } from 'src/card/model/card.model';
import { GetMultipleCardsWithChildrenQuery } from 'src/card/queries/impl';
import { CommonTools } from 'src/common/common.service';
import { MappedItem } from 'src/common/interfaces';
import { GlobalDocumentUpdate } from 'src/common/types/update.type';
import { LoggingService } from 'src/logging/logging.service';
import { ProjectsRepository } from 'src/project/project.repository';
import { UpdatePaymentCommand } from '../impl';
import { v4 as uuidv4 } from 'uuid';
import { Activity } from '../../../../common/types/activity.type';

@CommandHandler(UpdatePaymentCommand)
export class UpdatePaymentCommandHandler
  implements ICommandHandler<UpdatePaymentCommand>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
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
      const { updatePaymentDto, caller } = command;

      /** Get all the cards with all their children */
      const cards = await this.queryBus.execute(
        new GetMultipleCardsWithChildrenQuery(updatePaymentDto.cardIds),
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
            caller,
          );
          const automationUpdate = this.automationService.handleAutomation(
            child,
            project,
            childCardUpdate[child.id],
            command.caller,
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

        const parentCardUpdate = this.updatePaymentInfo(
          card,
          updatePaymentDto,
          caller,
        );

        const automationUpdate = this.automationService.handleAutomation(
          card,
          project,
          parentCardUpdate[card.id],
          command.caller,
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
    caller: string,
  ): MappedItem<Card> {
    const activity = {
      activityId: 'updateStatus',
      changeLog: {
        prev: {
          status: card.status,
        },
        next: {
          status: {
            active: false,
            paid: true,
            archived: false,
          },
        },
      },
      timestamp: new Date(),
      actorId: caller,
      commitId: uuidv4(),
      comment: false,
      content: '',
    } as Activity;
    return {
      [card.id]: {
        activity: [...card.activity, activity],
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

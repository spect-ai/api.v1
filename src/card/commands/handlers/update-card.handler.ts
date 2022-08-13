import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  PerformAutomationCommand,
  PerformMultipleAutomationsCommand,
} from 'src/automation/commands/impl';
import { ActivityBuilder } from 'src/card/activity.builder';
import { CardsRepository } from 'src/card/cards.repository';
import { UpdateCardRequestDto } from 'src/card/dto/update-card-request.dto';
import { Card } from 'src/card/model/card.model';
import { Diff } from 'src/card/types/types';
import { CommonTools } from 'src/common/common.service';
import { MappedItem, MappedPartialItem } from 'src/common/interfaces';
import { Project } from 'src/project/model/project.model';
import { UpdateCardCommand } from '../impl/update-card.command';
@CommandHandler(UpdateCardCommand)
export class UpdateCardCommandHandler
  implements ICommandHandler<UpdateCardCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly commandBus: CommandBus,
    private readonly commonTools: CommonTools,
  ) {}

  async execute(command: UpdateCardCommand): Promise<Card> {
    try {
      const { updateCardDto, card, project, circle, caller } = command;

      const updatedCard = this.getUpdatedCard(card, project, updateCardDto);
      console.log('updatedCard', updatedCard);
      const objectifiedCard = this.commonTools.objectify([card], 'id');
      const flattenedUpdate = this.commonTools.flatten(updatedCard);
      const multipleItemContainer = await this.commandBus.execute(
        new PerformMultipleAutomationsCommand(
          flattenedUpdate,
          objectifiedCard,
          caller,
          {
            [card.id]: project,
          },
          {
            [card.id]: circle,
          },
        ),
      );
      console.log(multipleItemContainer);
      return multipleItemContainer;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  getDifference(card: Card, request: UpdateCardRequestDto): Diff {
    const filteredCard = {};
    const filteredCardArrayFields = {};
    const filteredRequest = {};

    for (const key in request) {
      if (Array.isArray(card[key])) filteredCardArrayFields[key] = card[key];
      else {
        filteredCard[key] = card[key];
        filteredRequest[key] = request[key];
      }
    }

    const objDiff = this.commonTools.findDifference(
      filteredCard,
      filteredRequest,
    ) as Diff;
    const arrayDiff = {};
    for (const key in filteredCardArrayFields) {
      arrayDiff[key] = this.commonTools.findDifference(
        filteredCardArrayFields[key],
        request[key],
      );
      if (arrayDiff[key]['added'].length > 0) {
        objDiff['added'] = {
          ...objDiff['added'],
          [key]: arrayDiff[key]['added'],
        };
      }
      if (arrayDiff[key]['removed'].length > 0) {
        objDiff['deleted'] = {
          ...objDiff['deleted'],
          [key]: arrayDiff[key]['removed'],
        };
      }
    }
    return objDiff;
  }

  getUpdatedCard(
    card: Card,
    project: Project,
    updateCardDto: UpdateCardRequestDto,
  ): MappedPartialItem<Card> {
    // const activities = this.activityBuilder.buildUpdatedCardActivity(
    //   updateCardDto,
    //   card,
    //   project,
    // );
    // const updatedActivity = [...card.activity, ...activities];

    if (updateCardDto.columnId) {
      if (!project.columnOrder.includes(updateCardDto.columnId))
        throw new HttpException(
          'Column Id must be in the project column order',
          HttpStatus.NOT_FOUND,
        );
    }
    const res = {
      [card.id]: {
        ...updateCardDto,
        //activity: updatedActivity,
      },
    };

    /**
     * Only add status and rewards when there is an update, otherwise it affects the automation workflow
     * in case there is a status update due to some automaion. This is because the normal card update is always given higher priority
     * over the updates due to the automation workflow.
     * Updating status and rewards like following makes sure partial updates are supported. For example, reward can be update by
     * just passing one property of reward like 'chain' or 'value'.
     */
    if (updateCardDto.status) {
      res[card.id].status = {
        ...card.status,
        ...updateCardDto.status,
      };
    }
    if (updateCardDto.reward) {
      res[card.id].reward = {
        ...card.reward,
        ...updateCardDto.reward,
        chain: {
          ...card.reward.chain,
          ...updateCardDto.reward?.chain,
        },
        token: {
          ...card.reward.token,
          ...updateCardDto.reward?.token,
        },
      };
    }

    return res;
  }
}

import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { CardsRepository } from 'src/card/cards.repository';
import { CreateCardRequestDto } from 'src/card/dto/create-card-request.dto';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { CommonTools } from 'src/common/common.service';
import { MappedItem } from 'src/common/interfaces';
import { Activity } from 'src/common/types/activity.type';
import { v4 as uuidv4 } from 'uuid';
import { CreateCardCommand } from '../impl';

@CommandHandler(CreateCardCommand)
export class CreateCardCommandHandler
  implements ICommandHandler<CreateCardCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly queryBus: QueryBus,
    private readonly commonTools: CommonTools,
  ) {}

  async execute(command: CreateCardCommand): Promise<Card> {
    try {
      const { createCardDto, project, circle, caller, parentCard } = command;
      const cardNum = await this.cardsRepository.count({
        project: createCardDto.project,
      });
      /** Get the created card object */
      const newCard = this.getCreatedCard(
        createCardDto,
        project.slug,
        cardNum,
        caller,
      );
      /** Commit to db */
      const createdCard = await this.cardsRepository.create(newCard);

      /** Get the added sub card objects */
      const newChildCards = this.getCreatedChildCards(
        createCardDto,
        createdCard,
        circle,
        project.slug,
        cardNum + 1,
        caller,
      );

      /** Commit to db */
      const createdChildCards = await this.cardsRepository.insertMany(
        newChildCards,
      );

      /** Update parent card's children if it is a sub card and get the parent card object. */
      const updatedParentCard = this.addToParentCard(createdCard, parentCard);
      /** Update current card's children if it has sub cards and get the current card object */
      const cardWithUpdatedChildren = this.addToParentCard(
        createdChildCards,
        createdCard,
      );

      /** Merge all the card updates */
      const updatedCards = this.commonTools.mergeObjects(
        updatedParentCard,
        cardWithUpdatedChildren,
      );

      const updateAcknowledgment =
        await this.cardsRepository.bundleUpdatesAndExecute(updatedCards);

      if (updateAcknowledgment.hasWriteErrors()) {
        throw updateAcknowledgment.getWriteErrors();
      }

      /** Get parent card and return it if there is a parent */
      if (Object.keys(updatedParentCard)?.length > 0) {
        const res = await this.cardsRepository.getCardWithPopulatedReferences(
          parentCard.id,
        );
        console.log(res);
        return res;
      }

      return Object.assign(createdCard, { children: createdChildCards });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed card creation',
        error.message,
      );
    }
  }

  getCreatedCard(
    createCardDto: CreateCardRequestDto,
    projectSlug: string,
    slugNum: number,
    caller: string,
  ): Partial<Card> {
    createCardDto.type = createCardDto.type || 'Task';
    const activity = this.buildNewCardActivity(createCardDto, caller);

    return {
      ...createCardDto,
      slug: `${projectSlug}-${slugNum.toString()}`,
      activity: [activity],
      creator: caller,
      columnId: createCardDto.parent ? null : createCardDto.columnId,
    };
  }

  getCreatedChildCards(
    createCardDto: CreateCardRequestDto,
    parentCard: Card,
    circle: Circle,
    projectSlug: string,
    startSlugNum: number,
    caller: string,
  ): Card[] {
    const childCards = createCardDto.childCards;
    if (!childCards || childCards.length === 0) return [];

    let slugNum = startSlugNum;
    const cards = [];
    for (const childCard of childCards) {
      createCardDto.type = createCardDto.type || 'Task';
      const activity = this.buildNewCardActivity(createCardDto, caller);

      cards.push({
        ...childCard,
        project: childCard.project || createCardDto.project,
        circle: childCard.circle || circle.id,
        parent: parentCard.id,
        reward: createCardDto.reward || { ...circle.defaultPayment, value: 0 }, //TODO: add reward to child cards
        columnId: null, // Child cards dont have a column
        activity: [activity],
        slug: `${projectSlug}-${slugNum.toString()}`,
      });
      slugNum++;
    }
    return cards;
  }

  addToParentCard(cards: Card[] | Card, parentCard: Card): MappedItem<Card> {
    if (!parentCard) return {};
    if (!Array.isArray(cards)) cards = [cards];
    const cardIds = cards.map((card) => card.id);
    return {
      [parentCard.id]: {
        children: [...parentCard.children, ...cardIds],
      },
    };
  }

  buildNewCardActivity(req: CreateCardRequestDto, caller: string): Activity {
    const newCardActivity = {} as Activity;

    newCardActivity.activityId = `createCard`;
    newCardActivity.changeLog = {
      prev: {},
      next: req,
    };
    newCardActivity.timestamp = new Date();
    newCardActivity.actorId = caller;
    newCardActivity.commitId = uuidv4();
    newCardActivity.comment = false;

    return newCardActivity;
  }
}

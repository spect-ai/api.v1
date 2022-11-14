import { InternalServerErrorException } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { CardsRepository } from 'src/card/cards.repository';
import { CreateCardRequestDto } from 'src/card/dto/create-card-request.dto';
import { DetailedCardResponseDto } from 'src/card/dto/detailed-card-response-dto';
import { CardCreatedEvent } from 'src/card/events/impl';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { CommonTools } from 'src/common/common.service';
import { MappedItem, MappedPartialItem } from 'src/common/interfaces';
import { Activity } from 'src/common/types/activity.type';
import { CardsProjectService } from 'src/project/cards.project.service';
import {
  AddCardsCommand,
  UpdateProjectCardNumByIdCommand,
} from 'src/project/commands/impl';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { v4 as uuidv4 } from 'uuid';
import { CreateCardCommand } from '../impl';
import { RegistryService } from 'src/registry/registry.service';
import { Payment } from 'src/common/models/payment.model';
@CommandHandler(CreateCardCommand)
export class CreateCardCommandHandler
  implements ICommandHandler<CreateCardCommand>
{
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly commonTools: CommonTools,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly cardProjectService: CardsProjectService,
    private readonly registryService: RegistryService,
  ) {}

  async execute(command: CreateCardCommand): Promise<{
    card: DetailedCardResponseDto;
    project: DetailedProjectResponseDto;
  }> {
    try {
      const { createCardDto, circle, caller, parentCard } = command;
      console.log(`creating card ${createCardDto.title}`);
      let project = command.project;
      const cardNum =
        project.cardCount ||
        (await this.cardsRepository.count({
          project: createCardDto.project,
        }));
      /** Get the created card object */
      const newCard = await this.getCreatedCard(
        createCardDto,
        circle,
        project.slug,
        cardNum,
        caller,
      );
      console.log(`avd`);

      /** Commit to db */
      const createdCard = await this.cardsRepository.create(newCard);
      /** Get the added sub card objects */
      const newChildCards = await this.getCreatedChildCards(
        createCardDto,
        createdCard,
        circle,
        project.slug,
        cardNum + 1,
        caller,
      );
      console.log(`cccc`);

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
      console.log(`123`);

      /** Merge all the card updates */
      const updatedCards = this.commonTools.mergeObjects(
        updatedParentCard,
        cardWithUpdatedChildren,
      );

      const updateAcknowledgment =
        await this.cardsRepository.bundleUpdatesAndExecute(updatedCards);
      console.log(`vbb`);

      if (updateAcknowledgment.hasWriteErrors()) {
        throw updateAcknowledgment.getWriteErrors();
      }

      /** If created card is not a sub card, add it to the project */
      if (!createCardDto.parent) {
        project = await this.commandBus.execute(
          new AddCardsCommand(
            [createdCard],
            undefined,
            project.id,
            cardNum + 1 + newChildCards.length, // set last card number by adding current number with 1 (created card) + number of child cards
          ),
        );
      } else {
        project = await this.commandBus.execute(
          new UpdateProjectCardNumByIdCommand(project.id, cardNum + 1),
        );
      }
      console.log(`gg`);

      for (const card of [createdCard, ...createdChildCards]) {
        this.eventBus.publish(
          new CardCreatedEvent(card, project.slug, circle.slug, caller),
        );
      }

      /** Get parent card and return it if there is a parent */
      if (Object.keys(updatedParentCard)?.length > 0) {
        const res = await this.cardsRepository.getCardWithPopulatedReferences(
          parentCard.id,
        );
        return {
          card: res,
          project:
            this.cardProjectService.projectPopulatedWithCardDetails(project),
        };
      }

      return {
        card: Object.assign(createdCard, { children: createdChildCards }),
        project:
          this.cardProjectService.projectPopulatedWithCardDetails(project),
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed card creation',
        error.message,
      );
    }
  }

  async getCreatedCard(
    createCardDto: CreateCardRequestDto,
    circle: Circle,
    projectSlug: string,
    slugNum: number,
    caller: string,
  ): Promise<Partial<Card>> {
    createCardDto.type = createCardDto.type || 'Task';
    createCardDto.reward = await this.getReward(createCardDto, circle);
    const activity = this.buildNewCardActivity(createCardDto, caller);
    return {
      ...createCardDto,
      slug: `${projectSlug}-${slugNum.toString()}`,
      activity: [activity],
      creator: caller,
      columnId: createCardDto.parent ? null : createCardDto.columnId,
      //parent: createCardDto.parent || null,
    };
  }

  async getCreatedChildCards(
    createCardDto: CreateCardRequestDto,
    parentCard: Card,
    circle: Circle,
    projectSlug: string,
    startSlugNum: number,
    caller: string,
  ): Promise<Card[]> {
    const childCards = createCardDto.childCards;
    if (!childCards || childCards.length === 0) return [];

    let slugNum = startSlugNum;
    const cards = [];

    for (const childCard of childCards) {
      createCardDto.type = createCardDto.type || 'Task';
      createCardDto.reward = await this.getReward(childCard, circle);
      const activity = this.buildNewCardActivity(createCardDto, caller);
      cards.push({
        ...childCard,
        project: childCard.project || createCardDto.project,
        circle: childCard.circle || circle.id,
        parent: parentCard.id,
        columnId: null, // Child cards dont have a column
        activity: [activity],
        slug: `${projectSlug}-${slugNum.toString()}`,
      });
      slugNum++;
    }
    return cards;
  }

  addToParentCard(
    cards: Card[] | Card,
    parentCard: Card,
  ): MappedPartialItem<Card> {
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

  async getReward(
    createCardDto: CreateCardRequestDto,
    circle: Circle,
  ): Promise<Payment> {
    if (
      !createCardDto.reward ||
      !createCardDto.reward.chain ||
      !createCardDto.reward.chain.chainId
    )
      createCardDto.reward = { ...circle.defaultPayment, value: 0 };
    if (
      !createCardDto.reward.token ||
      !createCardDto.reward.token.address ||
      !createCardDto.reward.token.symbol
    ) {
      const registry = await this.registryService.getRegistry();
      createCardDto.reward.token =
        registry[createCardDto.reward.chain.chainId].tokenDetails['0x0'];
    }
    return createCardDto.reward;
  }
}

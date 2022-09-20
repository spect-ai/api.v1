import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CirclesService } from 'src/circle/circles.service';
import { CirclePermission } from 'src/common/types/role.type';
import { DetailedProjectResponseDto } from 'src/project/dto/detailed-project-response.dto';
import { ProjectsRepository } from 'src/project/project.repository';
import { RequestProvider } from 'src/users/user.provider';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import {
  MultipleValidCardActionResponseDto,
  ValidCardActionResponseDto,
} from './dto/card-access-response.dto';
import { Card } from './model/card.model';
import { GetCardByIdQuery, GetMultipleCardsByIdsQuery } from './queries/impl';
import { CardValidationService } from './validation.cards.service';

@Injectable()
export class ActionService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly circleService: CirclesService,
    private readonly validationService: CardValidationService,
    private readonly cardsService: CardsService,
    private readonly projectRepository: ProjectsRepository,
    private readonly queryBus: QueryBus,
  ) {}

  canCreateCard(
    circlePermissions: CirclePermission,
    cardType: 'Task' | 'Bounty' = 'Task',
  ) {
    if (
      circlePermissions.createNewCard &&
      circlePermissions.createNewCard[cardType]
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only circle members that have permission to create new cards can duplicate card',
      };
  }

  canUpdateGeneralInfo(
    card: Card,
    circlePermissions: CirclePermission,
    userId: string,
  ) {
    if (
      (card.reviewer && card.reviewer.includes(userId)) ||
      (circlePermissions.manageCardProperties &&
        circlePermissions.manageCardProperties[card.type])
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only reviewers and circle members that have permission to manage cards can update this card info',
      };
  }

  canUpdateDeadline(
    card: Card,
    circlePermissions: CirclePermission,
    userId: string,
  ) {
    if (!card.status.active)
      return {
        valid: false,
        reason: 'Card has been closed already',
      };
    if (
      (card.reviewer && card.reviewer.includes(userId)) ||
      (card.assignee && card.assignee.includes(userId)) ||
      (circlePermissions.manageCardProperties &&
        circlePermissions.manageCardProperties[card.type])
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only reviewers, assignees and circle members that have permission to manage cards can update deadline',
      };
  }

  canUpdateStartDate(
    card: Card,
    circlePermissions: CirclePermission,
    userId: string,
  ) {
    if (!card.status.active)
      return {
        valid: false,
        reason: 'Card has been closed already',
      };
    if (
      (card.reviewer && card.reviewer.includes(userId)) ||
      (card.assignee && card.assignee.includes(userId)) ||
      (circlePermissions.manageCardProperties &&
        circlePermissions.manageCardProperties[card.type])
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only reviewers, assignees and circle members that have permission to manage cards can update start Date',
      };
  }

  canUpdateColumn(
    card: Card,
    circlePermissions: CirclePermission,
    userId: string,
  ) {
    if (
      (card.reviewer && card.reviewer.includes(userId)) ||
      (card.assignee && card.assignee.includes(userId)) ||
      (circlePermissions.manageCardProperties &&
        circlePermissions.manageCardProperties[card.type])
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only reviewers, assignees and circle members that have permission to manage cards can update column',
      };
  }

  canUpdateAssignee(
    card: Card,
    circlePermissions: CirclePermission,
    userId: string,
  ) {
    if (!card.status.active)
      return {
        valid: false,
        reason: 'Card has been closed already',
      };
    if (card.type === 'Bounty') {
      if (
        (card.reviewer && card.reviewer.includes(userId)) ||
        (circlePermissions.manageCardProperties &&
          circlePermissions.manageCardProperties[card.type])
      )
        return { valid: true };
      else
        return {
          valid: false,
          reason:
            'Only reviewers and circle members that have permission to manage cards can update column',
        };
    } else if (card.type === 'Task') {
      if (
        (card.reviewer && card.reviewer.includes(userId)) ||
        (card.assignee && card.assignee.includes(userId)) ||
        (circlePermissions.manageCardProperties &&
          circlePermissions.manageCardProperties[card.type])
      )
        return { valid: true };
      else
        return {
          valid: false,
          reason:
            'Only reviewers, assignees and circle members that have permission to manage cards can update column',
        };
    }
  }

  canClaim(card: Card, circlePermissions: CirclePermission, userId: string) {
    if (
      card.status.active &&
      card.assignee?.length === 0 &&
      circlePermissions.canClaim &&
      circlePermissions.canClaim[card.type]
    ) {
      return { valid: true };
    } else
      return {
        valid: false,
        reason:
          'Only users that have correct circle permissions can claim task if task doesnt have an assignee',
      };
  }

  canApply(card: Card, userId: string) {
    if (
      card.type === 'Bounty' &&
      card.assignee?.length === 0 &&
      card.status.active &&
      !card.reviewer?.includes(userId)
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Can only apply on bounties that are unassigned if not a reviewer',
      };
  }

  canSubmit(card: Card, userId: string) {
    if (card.assignee?.includes(userId)) return { valid: true };
    else
      return {
        valid: false,
        reason: 'Can only submit work if assigned to card',
      };
  }

  canAddRevisionInstructions(
    card: Card,
    circlePermissions: CirclePermission,
    userId: string,
  ) {
    if (!card.status.active)
      return {
        valid: false,
        reason: 'Card has been closed already',
      };
    if (
      card.reviewer?.includes(userId) ||
      (circlePermissions.reviewWork && circlePermissions.reviewWork[card.type])
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only card reviewers and members who have permission to review in the circle can review card',
      };
  }

  canAddFeedback(
    card: Card,
    circlePermissions: CirclePermission,
    userId: string,
  ) {
    if (
      card.reviewer?.includes(userId) ||
      (circlePermissions.reviewWork && circlePermissions.reviewWork[card.type])
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only card reviewers and members who have permission to review in the circle can add feedback',
      };
  }

  canClose(card: Card, circlePermissions: CirclePermission, userId: string) {
    if (
      card.status.active &&
      ((card.reviewer && card.reviewer.includes(userId)) ||
        (circlePermissions.manageCardProperties &&
          circlePermissions.manageCardProperties[card.type]))
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only reviewer and circle members that have permission to manage cards can close card',
      };
  }

  canPay(card: Card, circlePermissions: CirclePermission) {
    if (
      circlePermissions.makePayment &&
      card.assignee?.length > 0 &&
      !card.status.paid &&
      card.reward?.value &&
      card.reward?.value > 0
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only circle members that have permission to pay rewards can pay for cards that have an assignee and reward',
      };
  }

  canArchive(card: Card, circlePermissions: CirclePermission, userId: string) {
    if (
      (card.reviewer && card.reviewer.includes(userId)) ||
      (circlePermissions.manageCardProperties &&
        circlePermissions.manageCardProperties[card.type])
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only reviewers and circle members that have permission to manage cards can archive card',
      };
  }

  canDuplicate(card: Card, circlePermissions: CirclePermission) {
    if (
      circlePermissions.createNewCard &&
      circlePermissions.createNewCard[card.type]
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only circle members that have permission to create new cards can duplicate card',
      };
  }

  canCreateDiscordThread(card: Card) {
    if (!card.status.active)
      return {
        valid: false,
        reason: 'Card has been closed already',
      };
    return { valid: true };
  }

  validActions(
    card: Card,
    circlePermissions: CirclePermission,
    userId: string,
  ) {
    return {
      createCard: this.canCreateCard(circlePermissions, card.type),
      updateGeneralCardInfo: this.canUpdateGeneralInfo(
        card,
        circlePermissions,
        userId,
      ),
      updateDeadline: this.canUpdateDeadline(card, circlePermissions, userId),
      updateStartDate: this.canUpdateStartDate(card, circlePermissions, userId),
      updateColumn: this.canUpdateColumn(card, circlePermissions, userId),
      updateAssignee: this.canUpdateAssignee(card, circlePermissions, userId),
      claim: this.canClaim(card, circlePermissions, userId),
      applyToBounty: this.canApply(card, userId),
      submit: this.canSubmit(card, userId),
      addRevisionInstruction: this.canAddRevisionInstructions(
        card,
        circlePermissions,
        userId,
      ),
      addFeedback: this.canAddFeedback(card, circlePermissions, userId),
      close: this.canClose(card, circlePermissions, userId),
      pay: this.canPay(card, circlePermissions),
      archive: this.canArchive(card, circlePermissions, userId),
      duplicate: this.canDuplicate(card, circlePermissions),
      createDiscordThread: this.canCreateDiscordThread(card),
    };
  }

  async getValidActions(
    id: string,
    card?: Card,
  ): Promise<ValidCardActionResponseDto> {
    const userId = this.requestProvider.user.id;
    const cardToQuery =
      card ||
      (await this.queryBus.execute(
        new GetCardByIdQuery(id, {
          project: {
            parents: 1,
          },
        }),
      ));
    this.validationService.validateCardExists(cardToQuery);
    const circlePermissions =
      await this.circleService.getCollatedUserPermissions(
        (cardToQuery.project as unknown as DetailedProjectResponseDto).parents,
        userId,
      );
    return this.validActions(cardToQuery, circlePermissions, userId);
  }

  async getValidActionsForMultipleCards(
    ids: string[],
  ): Promise<MultipleValidCardActionResponseDto> {
    const validActions = {} as MultipleValidCardActionResponseDto;
    if (!ids) return validActions;
    const cards = await this.queryBus.execute(
      new GetMultipleCardsByIdsQuery(ids, {
        project: {
          parents: 1,
        },
      }),
    );
    for (const card of cards) {
      const validAction = await this.getValidActions(card.id, card);
      validActions[card.id] = validAction;
    }

    return validActions;
  }

  async getValidActionsWithProjectSlug(
    slug: string,
  ): Promise<MultipleValidCardActionResponseDto> {
    try {
      const project =
        await this.projectRepository.getProjectWithUnpPopulatedReferencesBySlug(
          slug,
        );

      if (!project)
        throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
      const res = await this.getValidActionsForMultipleCards(project.cards);
      return res;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed getting valid actions',
        error.message,
      );
    }
  }

  async getValidActionsWithCardAndProjectSlug(
    projectSlug: string,
    cardSlug: string,
  ): Promise<ValidCardActionResponseDto> {
    const userId = this.requestProvider.user.id;
    const card =
      await this.cardsService.getDetailedCardByProjectSlugAndCardSlug(
        projectSlug,
        cardSlug,
      );
    const circlePermissions =
      await this.circleService.getCollatedUserPermissions(
        (card.project as DetailedProjectResponseDto).parents,
        userId,
      );
    return this.validActions(card as Card, circlePermissions, userId);
  }
}

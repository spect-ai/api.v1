import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CirclesService } from 'src/circle/circles.service';
import { Circle } from 'src/circle/model/circle.model';
import { CirclePermission } from 'src/common/types/role.type';
import { RequestProvider } from 'src/users/user.provider';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import {
  MultipleValidCardActionResponseDto,
  ValidCardActionResponseDto,
} from './dto/card-access-response.dto';
import { Card } from './model/card.model';
import { CardValidationService } from './validation.cards.service';

@Injectable()
export class ActionService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardsRepository: CardsRepository,
    private readonly circleRepository: CirclesRepository,
    private readonly circleService: CirclesService,
    private readonly validationService: CardValidationService,
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

  canCreateDiscordThread(card: Card, circle: Circle) {
    if (!card.status.active)
      return {
        valid: false,
        reason: 'Card has been closed already',
      };
    return { valid: true };
  }

  async getValidActions(id: string): Promise<ValidCardActionResponseDto> {
    const userId = this.requestProvider.user.id;
    const card = await this.cardsRepository.getCardWithPopulatedReferences(id);
    this.validationService.validateCardExists(card);

    const circle = await this.circleRepository.findById(card.circle);
    const circlePermissions =
      await this.circleService.getCollatedUserPermissions(
        [card.circle.toString()],
        userId,
      );
    return {
      createCard: this.canCreateCard(circlePermissions, card.type),
      updateGeneralCardInfo: this.canUpdateGeneralInfo(
        card,
        circlePermissions,
        userId,
      ),
      updateDeadline: this.canUpdateDeadline(card, circlePermissions, userId),
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
      createDiscordThread: this.canCreateDiscordThread(card, circle),
    };
  }

  async getValidActionsForMultipleCards(
    ids: string[],
  ): Promise<MultipleValidCardActionResponseDto> {
    const validActions = {} as MultipleValidCardActionResponseDto;
    if (!ids) return validActions;
    for (const id of ids) {
      const validAction = await this.getValidActions(id);
      validActions[id] = validAction;
    }

    return validActions;
  }
}

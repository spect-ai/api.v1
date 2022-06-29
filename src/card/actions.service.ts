import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CirclesService } from 'src/circle/circles.service';
import { Circle } from 'src/circle/model/circle.model';
import { CirclePermission } from 'src/common/types/role.type';
import { RequestProvider } from 'src/users/user.provider';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import { ValidCardActionResponseDto } from './dto/card-access-response.dto';
import { Card } from './model/card.model';

@Injectable()
export class ActionService {
  constructor(
    private readonly requestProvider: RequestProvider,
    private readonly cardService: CardsService,
    private readonly cardsRepository: CardsRepository,
    private readonly circleRepository: CirclesRepository,
    private readonly circleService: CirclesService,
  ) {}

  canUpdateGeneralInfo(card: Card, circlePermissions: CirclePermission) {
    if (
      card.reviewer &&
      card.reviewer.includes(this.requestProvider.user.id) &&
      circlePermissions.manageCardProperties
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only reviewer and circle members that have permission to manage cards can update this card info',
      };
  }

  canUpdateDeadline(card: Card, circle: Circle) {
    return { valid: true };
  }

  canUpdateColumn(card: Card, circle: Circle) {
    return { valid: true };
  }

  canUpdateAssignee(card: Card, circle: Circle) {
    return { valid: true };
  }

  canAssignMyself(card: Card, circle: Circle) {
    if (
      card.type === 'Task' &&
      card.status.active &&
      circle.members?.includes(this.requestProvider.user._id) // Possible that object id causes an issue in comparison
    ) {
      return { valid: true };
    } else
      return {
        valid: false,
        reason:
          'Only possible to assign yourself if its an active task and you are a member in the space',
      };
  }

  canApply(card: Card, circle: Circle) {
    if (card.type === 'Bounty' && card.assignee?.length === 0)
      return { valid: true };
    else
      return {
        valid: false,
        reason: 'Can only apply on bounties that are unassigned',
      };
  }

  canSubmit(card: Card, circle: Circle) {
    if (card.assignee?.includes(this.requestProvider.user.id))
      return { valid: true };
    else
      return {
        valid: false,
        reason: 'Can only submit work if assigned',
      };
  }

  canAddRevisionInstructions(card: Card, circlePermissions: CirclePermission) {
    if (
      card.reviewer?.includes(this.requestProvider.user.id) ||
      circlePermissions.reviewWork
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only card reviewers and members who have permission to review in the circle can review card',
      };
  }

  canAddFeedback(card: Card, circlePermissions: CirclePermission) {
    if (
      card.reviewer?.includes(this.requestProvider.user.id) ||
      circlePermissions.reviewWork
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only card reviewers and members who have permission to review in the circle can add feedback',
      };
  }

  canClose(card: Card, circlePermissions: CirclePermission) {
    if (
      card.reviewer &&
      card.reviewer.includes(this.requestProvider.user.id) &&
      circlePermissions.manageCardProperties
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
    if (circlePermissions.makePayment) return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only circle members that have permission to pay rewards can pay',
      };
  }

  canArchive(card: Card, circlePermissions: CirclePermission) {
    if (
      card.reviewer &&
      card.reviewer.includes(this.requestProvider.user.id) &&
      circlePermissions.manageCardProperties
    )
      return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only reviewer and circle members that have permission to manage cards can archive card',
      };
  }

  canDuplicate(card: Card, circlePermissions: CirclePermission) {
    if (circlePermissions.createNewCard) return { valid: true };
    else
      return {
        valid: false,
        reason:
          'Only circle members that have permission to create new cards can duplicate card',
      };
  }

  canCreateDiscordThread(card: Card, circle: Circle) {
    return { valid: true };
  }

  async getValidActions(id: string): Promise<ValidCardActionResponseDto> {
    const card = await this.cardsRepository.getCardWithPopulatedReferences(id);
    this.cardService.validateCardExists(card);

    const circle = await this.circleRepository.findById(card.circle);
    const circlePermissions =
      await this.circleService.getCollatedUserPermissions(
        [card.circle.toString()],
        this.requestProvider.user,
      );

    return {
      updateGeneralCardInfo: this.canUpdateGeneralInfo(card, circlePermissions),
      updateDeadline: this.canUpdateDeadline(card, circle),
      updateColumn: this.canUpdateColumn(card, circle),
      updateAssignee: this.canUpdateAssignee(card, circle),
      beAssigned: this.canAssignMyself(card, circle),
      applyToBounty: this.canApply(card, circle),
      submit: this.canSubmit(card, circle),
      addRevisionInstruction: this.canAddRevisionInstructions(
        card,
        circlePermissions,
      ),
      addFeedback: this.canAddFeedback(card, circlePermissions),
      close: this.canClose(card, circlePermissions),
      pay: this.canPay(card, circlePermissions),
      archive: this.canArchive(card, circlePermissions),
      duplicate: this.canDuplicate(card, circlePermissions),
      startThread: this.canCreateDiscordThread(card, circle),
    };
  }
}

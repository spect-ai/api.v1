import { IsObject } from 'class-validator';

export type ActionValidOrNotWithReason = {
  /**
   * Is the action valid
   */
  valid: boolean;

  /**
   * If action is invalid what is the reason?
   */
  reason?: string;
};

export class ValidCardActionResponseDto {
  /**
   * Can user create card?
   */
  @IsObject()
  canCreateCard: ActionValidOrNotWithReason;
  /**
   * Can user update general card info - title, desc, reward, labels, priority, reviewer?
   */
  @IsObject()
  updateGeneralCardInfo: ActionValidOrNotWithReason;

  /**
   * Can user update deadline?
   */
  @IsObject()
  updateDeadline: ActionValidOrNotWithReason;

  /**
   * Can user update column?
   */
  @IsObject()
  updateColumn: ActionValidOrNotWithReason;

  /**
   * Can user update assignee?
   */
  @IsObject()
  updateAssignee: ActionValidOrNotWithReason;

  /**
   * Can user apply to bounty?
   */
  @IsObject()
  applyToBounty: ActionValidOrNotWithReason;
  /**
   * Can user create a work unit?
   */
  @IsObject()
  submit: ActionValidOrNotWithReason;

  /**
   * Can user add revision instruction?
   */
  @IsObject()
  addRevisionInstruction: ActionValidOrNotWithReason;

  /**
   * Can user add revision instruction?
   */
  @IsObject()
  addFeedback: ActionValidOrNotWithReason;

  /**
   * Can user close task / bounty?
   */
  @IsObject()
  close: ActionValidOrNotWithReason;

  /**
   * Can user pay for task / bounty?
   */
  @IsObject()
  pay: ActionValidOrNotWithReason;

  /**
   * Can user archive task / bounty?
   */
  @IsObject()
  archive: ActionValidOrNotWithReason;

  /**
   * Can user duplicate task / bounty?
   */
  @IsObject()
  duplicate: ActionValidOrNotWithReason;

  /**
   * Can user start a discussion thread on discord for task / bounty?
   */
  @IsObject()
  createDiscordThread: ActionValidOrNotWithReason;
}

export class MultipleValidCardActionResponseDto {
  [id: string]: ValidCardActionResponseDto;
}

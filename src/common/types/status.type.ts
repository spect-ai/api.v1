export class Status {
  /**
   * Active
   */
  active: boolean;

  /**
   * Paid
   */
  paid: boolean;

  /**
   * Archived
   */
  archived: boolean;
}

export class CardStatus extends Status {
  /**
   * In review
   */
  inReview: boolean;

  /**
   * In revision
   */
  inRevision: boolean;
}

export class RetroStatus extends Status {}

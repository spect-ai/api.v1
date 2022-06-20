export type Activity = {
  /**
   * The commit id of the update of the activity, it is used to group updates that took place at the same time
   */
  commitId?: string;

  /**
   * The id of the person who performed the activity
   */
  actorId?: string;

  /**
   * The description / content of the activity
   */
  content?: string;

  /**
   * The timestamp of the activity
   */
  timestamp?: Date;

  /**
   * The timestamp of the activity
   */
  comment: boolean;
};

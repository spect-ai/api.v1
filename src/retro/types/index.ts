/** Mapping of owner of stats to the stats */
export type MappedStats = {
  [owner: string]: Stats;
};

export type Stats = {
  /**
   * The owner of these stats
   */
  owner?: string;

  /**
   * The votes given by stats owner
   */
  votesGiven?: object;

  /**
   * The votes remaining of stats owner
   */
  votesRemaining?: number;

  /**
   * The votes allocated to stats owner
   */
  votesAllocated?: number;

  /**
   * Can give votes to other members
   */
  canGive?: boolean;

  /**
   * Can receive votes from other members
   */
  canReceive?: boolean;
};

/** Feedback id mapped to feedback */
export type IndexedFeedback = {
  [id: string]: Feedback;
};

export type Feedback = {
  /**
   * The id of the feedback
   */
  id: string;
  /**
   * The person who has given the feedback
   */
  giver: string;

  /**
   * The person who has received the feedback
   */
  receiver: string;

  /**
   * The content of the feedback
   */
  content: string;
};

export type FeedbackGiven = {
  [user: string]: string[];
};

export type FeedbackReceived = {
  [user: string]: string[];
};

export type PopulatedRetroFields = {
  circle?: { [fieldName: string]: 0 | 1 };
};

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

export type MappedFeedback = {
  [recipient: string]: string;
};

export type Feedback = {
  [giver: string]: MappedFeedback;
};

export type PopulatedRetroFields = {
  circle?: { [fieldName: string]: 0 | 1 };
};

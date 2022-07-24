import { ObjectId } from 'mongoose';

export type WorkUnit = {
  unitId: string;
  /**
   * The persone thats adding he subission or revision
   */
  user: string;
  /**
   * The type of submission object (e.g. submission, revision instructions)
   */
  type: 'submission' | 'revision' | 'feedback';

  /**
   * The submission content
   */
  content: string;

  /**
   * The submission pr if any
   */
  pr?: string;

  createdAt: Date;
  updatedAt: Date;
};

export type WorkUnits = {
  [key: string]: WorkUnit;
};

export type WorkThread = {
  /**
   * The thread of the work units being done on the card
   */
  name: string;
  workUnits: WorkUnits;
  workUnitOrder: string[];
  status: 'accepted' | 'inReview' | 'inRevision' | 'draft';
  active: boolean;
  threadId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkThreads = {
  [key: string]: WorkThread;
};

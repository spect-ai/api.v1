import { ObjectId } from 'mongoose';

export type WorkUnit = {
  /**
   * The persone thats adding he subission or revision
   */
  user: ObjectId;
  /**
   * The type of submission object (e.g. submission, revision instructions)
   */
  type: 'submission' | 'revision' | 'feedback';

  /**
   * The submission content
   */
  content: string;

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

import { ObjectId } from 'mongoose';

export type ApplicationUnit = {
  applicationId: string;
  /**
   * The persone thats adding the application
   */
  user: string;

  /**
   * The application content
   */
  content: string;

  status: 'active' | 'rejected' | 'picked';

  createdAt: Date;
  updatedAt: Date;
};

export type ApplicationDetails = {
  [key: string]: ApplicationUnit;
};

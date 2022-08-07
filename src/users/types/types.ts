import { User } from '../model/users.model';

export type MappedUser = {
  [id: string]: Partial<User>;
};

export type Notification = {
  content: string;
  linkPath: string[];
  actor: string;
  timestamp: Date;
  ref: object;
};

export type Activity = {
  id: string;
  actionType: string;
  content: string;
  timestamp: Date;
  linkPath: string[];
  stakeholders: string[];
  ref: object;
};

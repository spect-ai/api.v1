import { User } from '../model/users.model';

export type MappedUser = {
  [id: string]: Partial<User>;
};

export type Notification = {
  content: string;
  linkPath: string[];
  actor: string;
  timestamp: Date;
};

export type Activity = {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  linkPath: string[];
  stakeholders: string[];
};

import { ChangeLog } from 'src/common/types/activity.type';
import { User } from '../model/users.model';

export type MappedUser = {
  [id: string]: Partial<User>;
};

export type Notification = {
  active: boolean;
  /* This redirection policy could cause issues if a card/project/circle is deleted or moved to a different location. Need
  to handle this on the frontend. */
  redirectTo: string[];
  objectRedirectTo: 'Card' | 'Project' | 'Circle';
  actor: string;
  action: string;
};

export type Activity = {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  changeLog: ChangeLog;
};

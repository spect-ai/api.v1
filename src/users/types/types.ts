import { User } from '../model/users.model';

export type MappedUser = {
  [id: string]: Partial<User>;
};

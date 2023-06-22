import { FilterQuery } from 'mongoose';
import { User } from 'src/users/model/users.model';

export class GetProfileQuery {
  constructor(
    public readonly filterQuery: FilterQuery<User>,
    public readonly caller: string,
    public readonly overridePrivacy = false,
    public readonly customPopulate?: {
      [key: string]: Record<string, unknown>;
    },
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

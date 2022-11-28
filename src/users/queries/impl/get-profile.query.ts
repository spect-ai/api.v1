import { FilterQuery } from 'mongoose';
import { User } from 'src/users/model/users.model';
import { PopulatedUserFields } from 'src/users/types/types';

export class GetProfileQuery {
  constructor(
    public readonly filterQuery: FilterQuery<User>,
    public readonly caller: string,
    public readonly customPopulate?: PopulatedUserFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

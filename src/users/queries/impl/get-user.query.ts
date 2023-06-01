import { FilterQuery } from 'mongoose';
import { User } from 'src/users/model/users.model';

type PopulatedUserFields = {
  [key: string]: Record<string, unknown>;
};
export class GetUserByIdQuery {
  constructor(
    public readonly id: string,
    public readonly caller: string,
    public readonly customPopulate?: PopulatedUserFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetMultipleUsersByIdsQuery {
  constructor(
    public readonly ids: string[],
    public readonly customPopulate?: PopulatedUserFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetUserByUsernameQuery {
  constructor(
    public readonly username: string,
    public readonly caller: string,
    public readonly customPopulate?: PopulatedUserFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetUserByFilterQuery {
  constructor(
    public readonly filter: FilterQuery<User>,
    public readonly caller: string,
    public readonly dontResolve?: boolean,
    public readonly customPopulate?: PopulatedUserFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetMultipleUsersByFilterQuery {
  constructor(
    public readonly filter: FilterQuery<User>,
    public readonly caller: string,
    public readonly customPopulate?: PopulatedUserFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

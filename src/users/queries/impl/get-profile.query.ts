import { PopulatedUserFields } from 'src/users/types/types';

export class GetProfileByIdQuery {
  constructor(
    public readonly id: string,
    public readonly caller: string,
    public readonly customPopulate?: PopulatedUserFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetProfileByUsernameQuery {
  constructor(
    public readonly id: string,
    public readonly caller: string,
    public readonly customPopulate?: PopulatedUserFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

import { ArrayField } from 'src/users/types/types';
import { User } from 'src/users/model/users.model';

export class MoveItemCommand {
  constructor(
    public readonly fieldFrom: ArrayField,
    public readonly fieldTo: ArrayField,
    public readonly item: string,
    public readonly user?: User,
    public readonly userId?: string,
  ) {}
}

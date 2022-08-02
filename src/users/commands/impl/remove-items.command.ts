import { User } from 'src/users/model/users.model';
import { FlattendedArrayFieldItems } from 'src/users/types/types';

export class RemoveItemsCommand {
  constructor(
    public readonly items: FlattendedArrayFieldItems[],
    public readonly user?: User,
    public readonly id?: string,
  ) {}
}

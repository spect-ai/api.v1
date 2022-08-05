import { User } from 'src/users/model/users.model';
import { FlattendedArrayFieldItems } from 'src/users/types/types';

export class AddItemsCommand {
  constructor(
    public readonly items: FlattendedArrayFieldItems[],
    public readonly user?: User,
    public readonly userId?: string,
  ) {}
}

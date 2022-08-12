import { Card } from 'src/card/model/card.model';
import { FlattendedArrayFieldItems } from 'src/card/types/types';

export class AddItemsCommand {
  constructor(
    public readonly items: FlattendedArrayFieldItems[],
    public readonly card?: Card,
    public readonly id?: string,
  ) {}
}

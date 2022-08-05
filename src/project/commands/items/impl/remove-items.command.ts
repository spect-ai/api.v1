import { Project } from 'src/project/model/project.model';
import { FlattendedArrayFieldItems } from 'src/project/types/types';

export class RemoveItemsCommand {
  constructor(
    public readonly items: FlattendedArrayFieldItems[],
    public readonly project?: Project,
    public readonly id?: string,
  ) {}
}

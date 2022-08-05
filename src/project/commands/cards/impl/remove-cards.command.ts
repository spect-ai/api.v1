import { Project } from 'src/project/model/project.model';

export class RemoveCardsCommand {
  constructor(
    public readonly cardIds: string[],
    public readonly project?: Project,
    public readonly id?: string,
  ) {}
}

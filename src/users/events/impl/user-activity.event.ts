import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { Project } from 'src/project/model/project.model';
import { Retro } from 'src/retro/models/retro.model';
import { Diff } from 'src/common/interfaces';

export class UserActivityEvent {
  constructor(
    public readonly actionType: string,
    public readonly itemType: string,
    public readonly item: Card | Retro | Circle | Project,
    public readonly linkPath: string[],
    public readonly actor: string,
    public readonly changeLog?: Diff<Card | Retro | Circle | Project>,
  ) {}
}

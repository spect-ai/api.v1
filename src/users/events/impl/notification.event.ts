import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { Diff } from 'src/common/interfaces';
import { Project } from 'src/project/model/project.model';
import { Retro } from 'src/retro/models/retro.model';

export class NotificationEvent {
  constructor(
    public readonly actionType: string,
    public readonly itemType: string,
    public readonly item: Card | Retro | Circle | Project,
    public readonly recipient: string,
    public readonly linkPath: string[],
    public readonly actor: string,
    public readonly diff?: Diff<Card | Retro | Circle | Project>,
  ) {}
}

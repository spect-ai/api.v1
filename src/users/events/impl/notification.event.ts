import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { Diff, MappedItem } from 'src/common/interfaces';
import { Project } from 'src/project/model/project.model';
import { Retro } from 'src/retro/models/retro.model';

export type NotifRef = {
  id: string;
  refType: 'user' | 'circle' | 'collection';
};

export class NotificationEvent {
  constructor(
    public readonly actionType: string,
    public readonly itemType: 'card' | 'circle' | 'project' | 'retro',
    public readonly item: Card | Retro | Circle | Project,
    public readonly recipient: string,
    public readonly linkPath: string[],
    public readonly actor: string,
    public readonly diff?: Diff<Card | Retro | Circle | Project>,
  ) {}
}

export class NotificationEventV2 {
  constructor(
    public readonly content: string,
    public readonly recipients: string[],
    public readonly ref?: MappedItem<NotifRef>,
  ) {}
}

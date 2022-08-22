import { Circle } from 'src/circle/model/circle.model';

export class UpdatedCircleEvent {
  constructor(public readonly circle: Circle, public readonly caller: string) {}
}

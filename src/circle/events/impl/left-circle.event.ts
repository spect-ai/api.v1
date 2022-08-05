import { Circle } from 'src/circle/model/circle.model';

export class LeftCircleEvent {
  constructor(
    public readonly userId: string,
    public readonly id?: string,
    public readonly circle?: Circle,
  ) {}
}

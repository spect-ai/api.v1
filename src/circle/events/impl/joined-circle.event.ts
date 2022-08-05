import { Circle } from 'src/circle/model/circle.model';

export class JoinedCircleEvent {
  constructor(
    public readonly userId: string,
    public readonly id?: string,
    public readonly circle?: Circle,
  ) {}
}

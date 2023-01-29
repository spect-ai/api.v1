import { Circle } from 'src/circle/model/circle.model';
import { User } from 'src/users/model/users.model';

export class UpdatedCircleEvent {
  constructor(
    public readonly circle: Circle,
    public readonly caller: string,
    public readonly eventName?: string,
  ) {}
}

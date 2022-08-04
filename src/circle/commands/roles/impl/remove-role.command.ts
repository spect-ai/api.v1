import { Circle } from 'src/circle/model/circle.model';

export class RemoveRoleCommand {
  constructor(
    public readonly roleId: string,
    public readonly circle?: Circle,
    public readonly id?: string,
  ) {}
}

import { Circle } from 'src/circle/model/circle.model';

export class RemoveProjectsCommand {
  constructor(
    public readonly projectIds: string[],
    public readonly circle?: Circle,
    public readonly id?: string,
  ) {}
}

export class RemoveProjectsFromMultipleCirclesCommand {
  constructor(
    public readonly projectIds: string[],
    public readonly circles?: Circle[],
    public readonly ids?: string[],
  ) {}
}

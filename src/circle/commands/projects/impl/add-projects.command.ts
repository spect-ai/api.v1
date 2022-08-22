import { Circle } from 'src/circle/model/circle.model';

export class AddProjectsCommand {
  constructor(
    public readonly projectIds: string[],
    public readonly circle?: Circle,
    public readonly id?: string,
  ) {}
}

export class AddProjectsToMultipleCirclesCommand {
  constructor(
    public readonly projectIds: string[],
    public readonly circles?: Circle[],
    public readonly ids?: string[],
  ) {}
}

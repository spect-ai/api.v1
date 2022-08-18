import { Project } from 'src/project/model/project.model';

export class CreatedProjectEvent {
  constructor(
    public readonly project: Project,
    public readonly caller: string,
  ) {}
}

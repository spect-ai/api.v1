import { Project } from 'src/project/model/project.model';

export class DeleteProjectByIdCommand {
  constructor(public readonly id?: string, public readonly project?: Project) {}
}

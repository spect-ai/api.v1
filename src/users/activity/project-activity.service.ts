import { Injectable } from '@nestjs/common';
import { Project } from 'src/project/model/project.model';
import { Reference } from '../types/types';

@Injectable()
export class ProjectActivityService {
  generateCardContent(
    actionType: string,
    project: Project,
  ): { content: string; ref: Reference } {
    switch (actionType) {
      case 'create':
        return this.createProjectActivity(project);
      case 'delete':
        return this.deleteProjectActivity(project);
      default:
        return null;
    }
  }

  createProjectActivity(project: Project): { content: string; ref: Reference } {
    return {
      content: `created a new project ${project.name}`,
      ref: {},
    };
  }

  deleteProjectActivity(project: Project): { content: string; ref: Reference } {
    return {
      content: `archived card ${project.name}`,
      ref: {},
    };
  }
}

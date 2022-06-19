import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Project } from './model/project.model';

@Injectable()
export class ProjectsRepository extends BaseRepository<Project> {
  constructor(@InjectModel(Project) projectModel) {
    super(projectModel);
  }

  async getProjectWithPopulatedReferences(id: string): Promise<Project> {
    return await this.findById(id).populate('parents').populate('cards', {
      title: 1,
      labels: 1,
      assignee: 1,
      reviewer: 1,
      reward: 1,
      priority: 1,
      deadline: 1,
      slug: 1,
    });
  }

  async getProjectWithPopulatedReferencesBySlug(
    slug: string,
  ): Promise<Project> {
    return await this.findOne({ slug: slug })
      .populate('parents')
      .populate('cards', {
        title: 1,
        labels: 1,
        assignee: 1,
        reviewer: 1,
        reward: 1,
        priority: 1,
        deadline: 1,
        slug: 1,
      });
  }
}

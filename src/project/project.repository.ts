import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Project } from './model/project.model';
import { Ref } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@Injectable()
export class ProjectsRepository extends BaseRepository<Project> {
  constructor(@InjectModel(Project) projectModel) {
    super(projectModel);
  }

  async getProjectWithPopulatedReferences(id: string): Promise<Project> {
    return await this.findById(id).populate('parents');
  }

  async getProjectWithPopulatedReferencesBySlug(
    slug: string,
  ): Promise<Project> {
    return await this.findOne({ slug: slug }).populate('parents');
  }
}

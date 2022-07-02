import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { DetailedProjectResponseDto } from './dto/detailed-project-response.dto';
import { UpdateProjectRequestDto } from './dto/update-project-request.dto';
import { Project } from './model/project.model';

const populatedCardFields = {
  title: 1,
  labels: 1,
  assignee: 1,
  reviewer: 1,
  reward: 1,
  priority: 1,
  deadline: 1,
  slug: 1,
  type: 1,
  project: 1,
  creator: 1,
  status: 1,
};

@Injectable()
export class ProjectsRepository extends BaseRepository<Project> {
  constructor(@InjectModel(Project) projectModel) {
    super(projectModel);
  }

  async getProjectWithUnpPopulatedReferences(id: string): Promise<Project> {
    return await this.findById(id);
  }

  async getProjectWithPopulatedReferences(id: string): Promise<Project> {
    return await this.findById(id)
      .populate('parents')
      .populate('cards', populatedCardFields, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        parent: {
          $exists: false,
        },
      });
  }

  async getProjectWithPopulatedReferencesBySlug(
    slug: string,
  ): Promise<Project> {
    return await this.findOne({ slug: slug })
      .populate('parents')
      .populate('cards', populatedCardFields, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        parent: {
          $exists: false,
        },
      });
  }

  async getProjectIdFromSlug(slug: string): Promise<Project> {
    return await this.findOne({ slug: slug })
      .setOptions({ projection: { _id: 1 } })
      .exec();
  }

  async updateProjectAndReturnWithPopulatedReferences(
    id: string,
    update: any,
  ): Promise<Project> {
    return await this.updateById(id, update)
      .populate('parents')
      .populate('cards', populatedCardFields, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        parent: {
          $exists: false,
        },
      });
  }
}

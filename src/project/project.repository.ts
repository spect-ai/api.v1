import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import mongodb from 'mongodb';
import { UpdateQuery } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Project } from './model/project.model';
import { MappedProject } from './types/types';

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

  async getProjectWithUnpPopulatedReferencesBySlug(
    slug: string,
  ): Promise<Project> {
    return await this.findOne({ slug: slug });
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
    update: UpdateQuery<Project>,
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

  async bundleUpdatesAndExecute(
    updates: MappedProject,
  ): Promise<mongodb.BulkWriteResult> {
    const queries = [];
    for (const [id, update] of Object.entries(updates)) {
      queries.push(this.updateOneByIdQuery(id, update));
    }
    if (queries.length === 0) return;
    const acknowledgment = await this.bulkWrite(queries);
    console.log(acknowledgment);

    if (acknowledgment.hasWriteErrors()) {
      console.log(acknowledgment.getWriteErrors());
      throw new HttpException(
        'Something went wrong while updating payment info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return acknowledgment;
  }
}

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import mongodb from 'mongodb';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Project } from './model/project.model';
import { MappedProject, PopulatedProjectFields } from './types/types';

const populatedCardFields = {
  title: 1,
  labels: 1,
  assignee: 1,
  reviewer: 1,
  reward: 1,
  priority: 1,
  deadline: 1,
  startDate: 1,
  slug: 1,
  type: 1,
  project: 1,
  creator: 1,
  status: 1,
  parent: 1,
  assignedCircle: 1,
};

const defaultPopulate: PopulatedProjectFields = {
  parents: {
    name: 1,
    slug: 1,
  },
  cards: {
    title: 1,
    labels: 1,
    assignee: 1,
    reviewer: 1,
    reward: 1,
    priority: 1,
    deadline: 1,
    startDate: 1,
    slug: 1,
    type: 1,
    project: 1,
    creator: 1,
    status: 1,
    parent: 1,
    children: {
      title: 1,
      slug: 1,
    },
    assignedCircle: 1,
    description: 1,
    activity: 1,
  },
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
      .populate({
        path: 'cards',
        select: populatedCardFields,
        populate: {
          path: 'children',
          select: {
            title: 1,
            slug: 1,
          },
        },
      });
  }

  async getProjectWithPopulatedReferencesBySlug(
    slug: string,
  ): Promise<Project> {
    return await this.findOne({ slug: slug })
      .populate('parents')
      .populate({
        path: 'cards',
        select: populatedCardFields,
        populate: {
          path: 'children',
          select: {
            title: 1,
            slug: 1,
          },
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
      .populate({
        path: 'cards',
        select: populatedCardFields,
        populate: {
          path: 'children',
          select: {
            title: 1,
            slug: 1,
          },
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

    if (acknowledgment.hasWriteErrors()) {
      console.log(acknowledgment.getWriteErrors());
      throw new HttpException(
        'Something went wrong while updating project',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return acknowledgment;
  }

  async getProjectBySlug(
    slug: string,
    customPopulate?: PopulatedProjectFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Project> {
    let query = this.findOne(
      {
        slug: slug,
      },
      {
        projection: selectedFields || {},
      },
    );
    let populatedFields = defaultPopulate;
    if (customPopulate) populatedFields = customPopulate;
    query = this.getQueryWithPopulatedFields(populatedFields, query);

    return await query.exec();
  }

  async getProjectById(
    id: string,
    customPopulate?: PopulatedProjectFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Project> {
    let query = this.findById(id, {
      projection: selectedFields || {},
    });

    let populatedFields = defaultPopulate;
    if (customPopulate) populatedFields = customPopulate;

    if (customPopulate) populatedFields = customPopulate;
    query = this.getQueryWithPopulatedFields(populatedFields, query);

    return await query.exec();
  }

  async getMultipleProjects(
    filter: FilterQuery<Project>,
    customPopulate?: PopulatedProjectFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Project[]> {
    const query = this.findAll(filter, {
      projection: selectedFields || {},
    });
    let populatedFields = defaultPopulate;
    if (customPopulate) populatedFields = customPopulate;

    Object.keys(populatedFields).forEach((key) => {
      query.populate(key, populatedFields[key]);
    });

    try {
      return await query.exec();
    } catch (err) {
      console.log(err);
      return [];
    }
  }

  getQueryWithPopulatedFields(populatedFields: object, query: any) {
    Object.keys(populatedFields).forEach((key) => {
      const populatedFieldsInPopulatedFields = [];
      const selectedFieldsInPopulatedFields = {};
      Object.keys(populatedFields[key]).forEach((k) => {
        if (typeof populatedFields[key][k] === 'object')
          populatedFieldsInPopulatedFields.push({
            path: k,
            select: populatedFields[key][k],
          });
        else if (populatedFields[key][k] === 1) {
          selectedFieldsInPopulatedFields[k] = 1;
        }
      });

      query.populate({
        path: key,
        select: selectedFieldsInPopulatedFields,
        populate: populatedFieldsInPopulatedFields,
      });
    });

    return query;
  }
}

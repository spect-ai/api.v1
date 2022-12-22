import { Injectable } from '@nestjs/common';
import { FilterQuery, ObjectId, PipelineStage, UpdateQuery } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { Circle, ExtendedCircle } from './model/circle.model';
import { PopulatedCircleFields } from './types';
import { CircleResponseDto } from './dto/detailed-circle-response.dto';
import { Project } from 'src/project/model/project.model';
import { Retro } from 'src/retro/models/retro.model';
import { Collection } from 'src/collection/model/collection.model';

const defaultPopulate: PopulatedCircleFields = {
  parents: {
    id: 1,
    name: 1,
    slug: 1,
  },
  children: {
    id: 1,
    name: 1,
    description: 1,
    slug: 1,
    avatar: 1,
    paymentAddress: 1,
  },
  projects: {
    id: 1,
    name: 1,
    description: 1,
    slug: 1,
  },
  collections: {
    id: 1,
    name: 1,
    slug: 1,
    description: 1,
    archived: 1,
    collectionType: 1,
    projectMetadata: {
      views: 1,
      viewOrder: 1,
    },
  },
  retro: {
    title: 1,
    slug: 1,
    id: 1,
    status: 1,
    reward: 1,
    members: 1,
  },
};

@Injectable()
export class CirclesRepository extends BaseRepository<Circle> {
  constructor(@InjectModel(Circle) circleModel) {
    super(circleModel);
  }

  async getCircle(id: string): Promise<Circle> {
    return await this.findById(id).exec();
  }

  async getCircleWithPopulatedReferences(id: string): Promise<Circle> {
    return await this.findById(id)
      .populate('parents')
      .populate('children')
      .populate('projects')
      .populate('collections')
      .populate('retro')
      .exec();
  }

  async getCircleWithPopulatedReferencesBySlug(slug: string): Promise<Circle> {
    return await this.findOne({ slug: slug })
      .populate('parents')
      .populate('children')
      .populate('projects')
      .populate('collections')
      .populate('retro')
      .exec();
  }

  async updateCircleAndReturnWithPopulatedReferences(
    id: string,
    update: UpdateQuery<Circle>,
  ) {
    return await this.updateById(id, update)
      .populate('parents')
      .populate('children')
      .populate('projects')
      .populate('collections')
      .populate('retro');
  }

  async getParentCirclesByUser(user: string): Promise<Circle[]> {
    const circles = await this.findAll({
      parents: { $exists: true, $eq: [] },
      members: { $in: [user] },
      'status.archived': { $ne: true },
    });
    return circles;
  }

  async getCircleWithUnpopulatedReferences(id: string): Promise<Circle> {
    return await this.findById(id);
  }

  async getCircleWithUnpopulatedReferencesBySlug(
    slug: string,
  ): Promise<Circle> {
    return await this.findOne({ slug: slug }).exec();
  }

  async getPublicParentCircles(): Promise<Circle[]> {
    return await this.findAll({
      parents: { $exists: true, $eq: [] },
      private: false,
    });
  }

  async getDefaultPayment(id: ObjectId) {
    const circle = await this.findByObjectId(id);
    return circle.defaultPayment;
  }

  async getCircleById(
    id: string,
    customPopulate?: PopulatedCircleFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Circle> {
    const query = this.findById(id, {
      projection: selectedFields || {},
    });
    let populatedFields = defaultPopulate;
    if (customPopulate) populatedFields = customPopulate;

    Object.keys(populatedFields).forEach((key) => {
      query.populate(key, populatedFields[key]);
    });

    return await query.exec();
  }

  async getCircles(
    filterQuery: FilterQuery<Circle>,
    customPopulate?: PopulatedCircleFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Circle[]> {
    const query = this.findAll(filterQuery, {
      projection: selectedFields || {},
    });
    let populatedFields = defaultPopulate;
    if (customPopulate) populatedFields = customPopulate;

    Object.keys(populatedFields).forEach((key) => {
      query.populate(key, populatedFields[key]);
    });

    try {
      return await query.exec();
    } catch (error) {
      return [];
    }
  }

  async getCircleBySlug(
    slug: string,
    customPopulate?: PopulatedCircleFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Circle> {
    const query = this.findOne(
      {
        slug: slug,
      },
      {
        projection: selectedFields || {},
      },
    );
    let populatedFields = defaultPopulate;
    if (customPopulate) populatedFields = customPopulate;

    Object.keys(populatedFields).forEach((key) => {
      query.populate(key, populatedFields[key]);
    });

    return await query.exec();
  }

  async getCircleByFilter(
    filterQuery: FilterQuery<Circle>,
    customPopulate?: PopulatedCircleFields,
    selectedFields?: Record<string, unknown>,
  ): Promise<Circle> {
    const query = this.findOne(filterQuery, {
      projection: selectedFields || {},
    });

    let populatedFields = defaultPopulate;
    if (customPopulate) populatedFields = customPopulate;

    Object.keys(populatedFields).forEach((key) => {
      query.populate(key, populatedFields[key]);
    });

    try {
      return await query.exec();
    } catch (error) {
      return null;
    }
  }

  async getCircleWithAllChildren(
    circleId: string,
    maxDepth?: number,
  ): Promise<ExtendedCircle> {
    const graphLookup = {
      from: 'circles',
      startWith: '$children',
      connectFromField: 'children',
      connectToField: '_id',
      as: 'flattenedChildren',
    } as PipelineStage.GraphLookup['$graphLookup'];
    if (maxDepth) graphLookup.maxDepth = maxDepth;
    const circles = await this.aggregate([
      {
        $match: {
          _id: this.toObjectId(circleId),
        },
      },
      {
        $graphLookup: graphLookup,
      },
    ]);

    /** Aggregate query doesnt add id so adding manually */
    for (const circle of circles) {
      circle.id = circle._id.toString();
      for (const child of circle.flattenedChildren) {
        child.id = child._id.toString();
      }
    }
    return circles[0];
  }

  async getCircleWithAllRelations(
    circleId: string,
    maxChildrenDepth?: number,
    maxParentsDepth?: number,
  ): Promise<ExtendedCircle> {
    const childrenGraphLookup = {
      from: 'circles',
      startWith: '$children',
      connectFromField: 'children',
      connectToField: '_id',
      as: 'flattenedChildren',
    } as PipelineStage.GraphLookup['$graphLookup'];

    const parentsGraphLookup = {
      from: 'circles',
      startWith: '$parents',
      connectFromField: 'parents',
      connectToField: '_id',
      as: 'flattenedParents',
    } as PipelineStage.GraphLookup['$graphLookup'];
    if (maxChildrenDepth) childrenGraphLookup.maxDepth = maxChildrenDepth;
    if (maxParentsDepth) parentsGraphLookup.maxDepth = maxParentsDepth;
    const circles = await this.aggregate([
      {
        $match: {
          _id: this.toObjectId(circleId),
        },
      },
      {
        $graphLookup: childrenGraphLookup,
      },
      {
        $graphLookup: parentsGraphLookup,
      },
    ]);

    /** Aggregate query doesnt add id so adding manually */
    for (const circle of circles) {
      circle.id = circle._id.toString();
      for (const child of circle.flattenedChildren) {
        child.id = child._id.toString();
      }
    }
    for (const circle of circles) {
      circle.id = circle._id.toString();
      for (const child of circle.flattenedParents) {
        child.id = child._id.toString();
      }
    }
    return circles[0];
  }

  async getCircleWithMinimalDetails(
    circle: Circle,
  ): Promise<CircleResponseDto> {
    const projects = {};
    if (circle?.projects) {
      for (const populatedProject of circle?.projects) {
        const project = populatedProject as unknown as Project;
        projects[project.id] = project;
      }
    }

    const children = {};
    if (circle?.children) {
      for (const populatedchild of circle?.children) {
        const child = populatedchild as unknown as Circle;
        children[child.id] = child;
      }
    }

    const retro = {};
    if (circle?.retro) {
      for (const populatedRetro of circle?.retro) {
        const ret = populatedRetro as unknown as Retro;
        retro[ret.id] = ret;
      }
    }

    const collections = {};
    if (circle?.collections) {
      for (const populatedCollection of circle?.collections) {
        const collection = populatedCollection as unknown as Collection;
        collections[collection.id] = {
          ...collection,
          projectMetadata: undefined, // remove projectMetadata from collection
          viewType: collection.projectMetadata?.views
            ? collection.projectMetadata?.views[
                collection.projectMetadata.viewOrder[0]
              ]?.type
            : undefined,
        };
      }
    }

    return {
      ...circle,
      projects,
      children,
      retro,
      collections,
    };
  }
}

import { FilterQuery } from 'mongoose';
import { Project } from 'src/project/model/project.model';
import { PopulatedProjectFields } from 'src/project/types/types';

export class GetProjectByIdQuery {
  constructor(
    public readonly id: string,
    public readonly customPopulate?: PopulatedProjectFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetProjectBySlugQuery {
  constructor(
    public readonly slug: string,
    public readonly customPopulate?: PopulatedProjectFields,
    public readonly selectedFields?: Record<string, unknown>,
  ) {}
}

export class GetMultipleProjectsQuery {
  constructor(
    public readonly filter: FilterQuery<Project>,
    public readonly customPopulate?: PopulatedProjectFields,
    public readonly selectedFields?: Record<string, unknown>,
    public readonly objectify?: boolean,
  ) {}
}

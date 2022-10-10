import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCollectionBySlugQuery } from '../queries';
import { ActivityResolver } from './activity.service';

@Injectable()
export class CrudService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly activityResolver: ActivityResolver,
  ) {}

  async getCollectionBySlug(slug: string) {
    const collection = await this.queryBus.execute(
      new GetCollectionBySlugQuery(slug),
    );
    collection.dataActivities = await this.activityResolver.resolveAll(
      collection.dataActivities,
    );
    return collection;
  }
}

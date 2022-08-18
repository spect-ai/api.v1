import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { ExtendedCircle } from 'src/circle/model/circle.model';
import { GetCircleNavigationQuery } from '../impl';

@QueryHandler(GetCircleNavigationQuery)
export class GetCircleNavigationQueryHandler
  implements IQueryHandler<GetCircleNavigationQuery>
{
  constructor(private readonly circlesRepository: CirclesRepository) {}

  async execute(query: GetCircleNavigationQuery): Promise<ExtendedCircle> {
    const { id, maxChildrenDepth, maxParentsDepth } = query;
    const circles = await this.circlesRepository.getCircleWithAllRelations(
      id,
      maxChildrenDepth,
      maxParentsDepth,
    );
    const res = {};

    return circles;
  }
}

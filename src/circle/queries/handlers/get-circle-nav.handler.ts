import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleNavigationQuery } from '../impl';

type Node = {
  id: string;
  title: string;
  slug: string;
};

type Edge = {
  source: string;
  target: string;
};

type NavType = {
  nodes: Partial<Circle>[];
  edges: Edge[];
};
@QueryHandler(GetCircleNavigationQuery)
export class GetCircleNavigationQueryHandler
  implements IQueryHandler<GetCircleNavigationQuery>
{
  constructor(private readonly circlesRepository: CirclesRepository) {}

  async execute(query: GetCircleNavigationQuery): Promise<NavType> {
    const { id, maxChildrenDepth, maxParentsDepth } = query;
    const circle = await this.circlesRepository.getCircleWithAllRelations(
      id,
      maxChildrenDepth,
      maxParentsDepth,
    );
    const allCircles = [
      circle,
      ...circle.flattenedChildren,
      ...circle.flattenedParents,
    ];
    const nodes = [] as Node[];

    for (const circle of allCircles) {
      nodes.push({
        id: circle.id,
        title: circle.name,
        slug: circle.slug,
      });
    }

    const edges = [] as Edge[];
    const alreadyAdded = new Set<string>();
    for (const circle of allCircles) {
      for (const parent of circle.parents) {
        if (alreadyAdded.has(`${circle.id}${parent.toString()}`)) {
          continue;
        }
        edges.push({
          source: circle.id,
          target: parent.toString(),
        });
        alreadyAdded.add(`${circle.id}${parent.toString()}`);
      }
      for (const child of circle.children) {
        if (alreadyAdded.has(`${child.toString()}${circle.id}`)) {
          continue;
        }
        edges.push({
          source: child.toString(),
          target: circle.id,
        });
        alreadyAdded.add(`${child.toString()}${circle.id}`);
      }
    }

    return {
      nodes,
      edges,
    };
  }
}

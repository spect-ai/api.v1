import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { GetCircleNavigationQuery } from '../impl';

type Node = {
  id: string;
  title: string;
};

type Edge = {
  source: string;
  target: string;
};

type NavType = {
  nodes: Partial<Circle>[];
  links: Edge[];
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
        id: circle.slug,
        title: circle.name,
      });
    }

    const links = [] as Edge[];
    const alreadyAdded = new Set<string>();
    for (const circle of allCircles) {
      for (const parent of circle.parents) {
        if (alreadyAdded.has(`${circle.id}${parent.toString()}`)) {
          continue;
        }
        const parentCircle = allCircles.find((c) => c.id === parent.toString());
        links.push({
          source: circle.slug,
          target: parentCircle.slug,
        });
        alreadyAdded.add(`${circle.id}${parent.toString()}`);
      }
      for (const child of circle.children) {
        if (alreadyAdded.has(`${child.toString()}${circle.id}`)) {
          continue;
        }
        let childCircle = allCircles.find((c) => c.id === child.toString());
        if (!childCircle) {
          childCircle = await this.circlesRepository.getCircleById(
            child.toString(),
          );
          nodes.push({
            id: childCircle.slug,
            title: childCircle.name,
          });
        }
        links.push({
          source: childCircle.slug,
          target: circle.slug,
        });
        alreadyAdded.add(`${child.toString()}${circle.id}`);
      }
    }

    return {
      nodes,
      links,
    };
  }
}

import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { GetReferralsQuery } from '../impl/get-referrals.query';
import { GetCirclesByFilterQuery } from 'src/circle/queries/impl';
import { Circle } from 'src/circle/model/circle.model';

@QueryHandler(GetReferralsQuery)
export class GetReferralsQueryHandler
  implements IQueryHandler<GetReferralsQuery>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext('GetReferralsQuery');
  }

  async execute(query: GetReferralsQuery) {
    try {
      const { caller } = query;
      if (!caller.referralCode) return [];
      const circles: Circle[] = await this.queryBus.execute(
        new GetCirclesByFilterQuery({
          referredBy: caller.referralCode,
        }),
      );
      return circles.map((circle) => {
        return {
          name: circle.name,
          slug: circle.slug,
          id: circle.id,
          pricingPlan: circle.pricingPlan,
          topUpMembers: circle.topUpMembers,
          createdAt: circle.createdAt,
          pendingBonus: circle.pendingBonus,
        };
      });
    } catch (error) {
      this.logger.error(`Failed getting referrals me with error: ${error}`);
      throw new InternalServerErrorException(`Failed getting referrals`, error);
    }
  }
}

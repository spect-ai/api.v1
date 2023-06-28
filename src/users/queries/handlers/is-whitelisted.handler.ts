import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { GetCircleBySlugQuery } from 'src/circle/queries/impl';
import { Circle } from 'src/circle/model/circle.model';
import { IsWhitelistedQuery } from '../impl/is-whitelisted.query';

@QueryHandler(IsWhitelistedQuery)
export class IsWhitelistedQueryHandler
  implements IQueryHandler<IsWhitelistedQuery>
{
  constructor(
    private readonly logger: LoggingService,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext('IsWhitelistedQuery');
  }

  async execute(query: IsWhitelistedQuery) {
    try {
      const { caller } = query;
      const spectCircle: Circle = await this.queryBus.execute(
        new GetCircleBySlugQuery('dada'),
      );
      if (spectCircle.memberRoles[caller.id].includes('referrers')) {
        return 'true';
      }
      return 'false';
    } catch (error) {
      this.logger.error(`Failed getting referrals me with error: ${error}`);
      throw new InternalServerErrorException(`Failed getting referrals`, error);
    }
  }
}

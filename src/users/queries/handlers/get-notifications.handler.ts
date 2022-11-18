import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';
import { LensService } from 'src/users/external/lens.service';
import { NotificationV2 } from 'src/users/types/types';
import { UsersRepository } from 'src/users/users.repository';
import { GetNotificationsQuery } from '../impl';

@QueryHandler(GetNotificationsQuery)
export class GetNotificationsQueryHandler
  implements IQueryHandler<GetNotificationsQuery>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly lensService: LensService,
    private readonly logger: LoggingService,
    private readonly commonTools: CommonTools,
  ) {
    this.logger.setContext('GetMeQueryHandler');
  }

  async execute(query: GetNotificationsQuery): Promise<NotificationV2[]> {
    try {
      const { caller } = query;
      console.log({ caller });
      if (!caller) {
        throw `User with id ${caller.id} not found`;
      }
      return caller.notificationsV2;
    } catch (error) {
      this.logger.error(
        `Failed getting user notifications with error: ${error}`,
      );
      throw new InternalServerErrorException(`Failed getting user me`, error);
    }
  }
}

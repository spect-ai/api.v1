import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';
import { NotificationV2 } from 'src/users/types/types';
import { UsersRepository } from 'src/users/users.repository';
import { GetNotificationsQuery, GetUnreadNotificationsQuery } from '../impl';

@QueryHandler(GetNotificationsQuery)
export class GetNotificationsQueryHandler
  implements IQueryHandler<GetNotificationsQuery>
{
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('GetNotifsHandler');
  }

  async execute(query: GetNotificationsQuery): Promise<NotificationV2[]> {
    try {
      const { caller, limit, page } = query;
      if (!caller) {
        throw `User with id ${caller.id} not found`;
      }
      const allNotifications = caller.notificationsV2;
      const notifications = allNotifications
        .reverse()
        .slice((page - 1) * limit, page * limit);
      return notifications;
    } catch (error) {
      this.logger.error(
        `Failed getting user notifications with error: ${error}`,
      );
      throw new InternalServerErrorException(`Failed getting user me`, error);
    }
  }
}

@QueryHandler(GetUnreadNotificationsQuery)
export class GetUnreadNotificationsQueryHandler
  implements IQueryHandler<GetUnreadNotificationsQuery>
{
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('GetUnreadNotifs');
  }

  async execute(query: GetUnreadNotificationsQuery): Promise<number> {
    try {
      const { caller } = query;
      if (!caller) {
        throw `User with id ${caller.id} not found`;
      }
      const allNotifications = caller.notificationsV2;
      return allNotifications.filter((n) => !n.read && n.read !== undefined)
        .length;
    } catch (error) {
      this.logger.error(
        `Failed getting user unread  notifications with error: ${error}`,
      );
      throw new InternalServerErrorException(
        `Failed getting user unread notifcations`,
        error,
      );
    }
  }
}

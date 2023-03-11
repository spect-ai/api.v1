import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { Diff } from 'src/common/interfaces';
import { Reference } from 'src/users/types/types';
import { UsersRepository } from 'src/users/users.repository';
import {
  NotificationEventV2,
  SingleEmailNotificationEvent,
  SingleNotificationEvent,
} from '../impl';
import { LoggingService } from 'src/logging/logging.service';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from 'src/mail/mail.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

@EventsHandler(NotificationEventV2)
export class NotificationEventV2Handler
  implements IEventHandler<NotificationEventV2>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('NotificationEventV2Handler');
  }

  async handle(event: NotificationEventV2) {
    try {
      console.log('NotificationEventHandler');
      const { content, avatar, redirect, timestamp, recipients } = event;
      console.log(recipients);
      for (const recipient of recipients) {
        const recipientEntity = await this.userRepository.findById(recipient);

        await this.userRepository.updateById(recipient, {
          notificationsV2: [
            ...(recipientEntity.notificationsV2 || []),
            {
              content,
              avatar,
              redirect,
              timestamp,
            },
          ],
        });
      }
    } catch (error) {
      // Make sure to not send a large object to the logger
      this.logger.error(
        `Failed adding notification to user with error: ${error.message}`,
      );
    }
  }
}

@EventsHandler(SingleNotificationEvent)
export class SingleNotificationEventHandler
  implements IEventHandler<SingleNotificationEvent>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly realtime: RealtimeGateway,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('SingleNotificationEventHandler');
  }

  async handle(event: SingleNotificationEvent) {
    try {
      console.log('NotificationEventHandler');
      const { content, avatar, redirect, timestamp, recipients } = event;
      const recipientEntity = await this.userRepository.findById(recipients[0]);
      const user = await this.userRepository.updateById(recipients[0], {
        notificationsV2: [
          ...(recipientEntity.notificationsV2 || []),
          {
            content,
            avatar,
            redirect,
            timestamp,
            read: false,
          },
        ],
      });
      const unreadNotifications = user.notificationsV2.filter(
        (notification) => !notification.read,
      );
      // console.log('realtime emit', unreadNotifications, recipients[0]);
      this.realtime.server.to(recipients[0]).emit('notification', {
        unreadNotifications: unreadNotifications.length,
      });
    } catch (error) {
      // Make sure to not send a large object to the logger
      this.logger.error(
        `Failed adding notification to user with error: ${error.message}`,
      );
    }
  }
}

@EventsHandler(SingleEmailNotificationEvent)
export class SingleEmailNotificationEventHandler
  implements IEventHandler<SingleEmailNotificationEvent>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
    private readonly mailService: MailService,
  ) {
    this.logger.setContext('SingleEmailNotificationEventHandler');
  }

  async handle(event: SingleEmailNotificationEvent) {
    try {
      console.log('NotificationEventHandler');
      const { recipient, content, subject, redirectUrl } = event;
      const recipientEntity = await this.userRepository.findById(recipient);
      if (recipientEntity.email) {
        const mail = {
          to: `${recipientEntity.email}`,
          from: {
            name: 'Spect Notifications',
            email: process.env.NOTIFICATION_EMAIL,
          }, // Fill it with your validated email on SendGrid account
          html: '<h1>Hello</h1>',
          template_id: 'd-29167d84858a4bbebd669512def5ee29',
          dynamic_template_data: {
            title: content,
            link: redirectUrl,
            subject: subject,
          },
        };

        return await this.mailService.send(mail);
      }
    } catch (error) {
      // Make sure to not send a large object to the logger
      this.logger.error(
        `Failed adding notification to user with error: ${error.message}`,
      );
    }
  }
}

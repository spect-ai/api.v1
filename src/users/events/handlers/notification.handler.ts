import { InternalServerErrorException } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { Diff } from 'src/common/interfaces';
import { Project } from 'src/project/model/project.model';
import { Retro } from 'src/retro/models/retro.model';
import { CardNotificationService } from 'src/users/notification/card-notification.service';
import { RetroNotificationService } from 'src/users/notification/retro-notification.service';
import { Reference } from 'src/users/types/types';
import { UsersRepository } from 'src/users/users.repository';
import { NotificationEvent } from '../impl';
import { LoggingService } from 'src/logging/logging.service';
import { v4 as uuidv4 } from 'uuid';

@EventsHandler(NotificationEvent)
export class NotificationEventHandler
  implements IEventHandler<NotificationEvent>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly cardNotificationService: CardNotificationService,
    private readonly retroNotificationService: RetroNotificationService,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('NotificationEventHandler');
  }

  async handle(event: NotificationEvent) {
    try {
      console.log('NotificationEventHandler');
      const { actionType, itemType, item, diff, recipient, linkPath, actor } =
        event;
      const recipientEntity = await this.userRepository.findById(recipient);
      if (!recipientEntity.notifications) {
        recipientEntity.notifications = [];
      }
      const generatedContent = this.generateContent(
        actionType,
        itemType,
        item,
        diff,
        recipient,
        actor,
      );
      if (generatedContent) {
        const { content, ref } = generatedContent;
        recipientEntity.notifications.push({
          id: uuidv4(),
          content: content,
          type: itemType,
          entityId: event.item?.id,
          ref: ref,
          linkPath,
          actor,
          timestamp: new Date(),
          read: false,
        });
        await this.userRepository.updateById(recipientEntity.id, {
          notifications: recipientEntity.notifications,
        });
      }
    } catch (error) {
      // Make sure to not send a large object to the logger
      this.logger.error(
        `Failed adding notification to user with error: ${error.message}`,
        {
          actionType: event.actionType,
          itemType: event.itemType,
          itemId: event.item?.id,
          diffKeys: {
            added: Object.keys(event.diff?.added),
            deleted: Object.keys(event.diff?.deleted),
            updatd: Object.keys(event.diff?.updated),
          },
          recipient: event.recipient,
          actor: event.actor,
        },
      );
    }
  }

  generateContent(
    actionType: string,
    itemType: string,
    item: Card | Circle | Project | Retro,
    diff: Diff<Card | Circle | Project | Retro>,
    recipient: string,
    actor: string,
  ): { content: string; ref: Reference } {
    switch (itemType) {
      case 'card':
        return this.cardNotificationService.generateCardContent(
          actionType,
          item as Card,
          diff as Diff<Card>,
          recipient,
          actor,
        );
      case 'retro':
        return this.retroNotificationService.generateRetroContent(
          actionType,
          item as Retro,
          diff as Diff<Retro>,
          recipient,
          actor,
        );
      default:
        return null;
    }
  }
}

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { Diff } from 'src/common/interfaces';
import { Project } from 'src/project/model/project.model';
import { Retro } from 'src/retro/models/retro.model';
import { CardNotificationService } from 'src/users/notification/card-notification.service';
import { UsersRepository } from 'src/users/users.repository';
import { NotificationEvent } from '../impl';

@EventsHandler(NotificationEvent)
export class NotificationEventHandler
  implements IEventHandler<NotificationEvent>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly cardNotificationService: CardNotificationService,
  ) {}

  async handle(event: NotificationEvent) {
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
        content: content,
        ref: ref,
        linkPath,
        actor,
        timestamp: new Date(),
      });
      await this.userRepository.update(recipientEntity);
    }
  }

  generateContent(
    actionType: string,
    itemType: string,
    item: Card | Circle | Project | Retro,
    diff: Diff<Card | Circle | Project | Retro>,
    recipient: string,
    actor: string,
  ): { content: string; ref: object } {
    switch (itemType) {
      case 'card':
        return this.cardNotificationService.generateCardContent(
          actionType,
          item as Card,
          diff as Diff<Card>,
          recipient,
          actor,
        );
      // case 'retro':
      //   return this.generateRetroContent(actionType, item as Retro);
      default:
        return null;
    }
  }

  generateRetroContent(actionType: string, retro: Retro): string {
    if (actionType === 'create') {
      return `has added a card`;
    }
  }
}

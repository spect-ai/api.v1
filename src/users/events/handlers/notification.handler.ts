import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UsersRepository } from 'src/users/users.repository';
import { NotificationEvent } from '../impl';

@EventsHandler(NotificationEvent)
export class NotificationEventHandler
  implements IEventHandler<NotificationEvent>
{
  constructor(private readonly userRepository: UsersRepository) {}

  async handle(event: NotificationEvent) {
    console.log('NotificationEventHandler');
    const { type, recipient, linkPath, actor, title } = event;
    const recipientEntity = await this.userRepository.findById(recipient);
    if (!recipientEntity.notifications) {
      recipientEntity.notifications = [];
    }
    recipientEntity.notifications.push({
      content: this.generateContent(type, title),
      linkPath,
      actor,
      timestamp: new Date(),
    });
    await this.userRepository.update(recipientEntity);
  }

  generateContent(type: string, title: string): string {
    if (type === 'createRetro') {
      return `[actor] has added you to the retro ${title}`;
    }
  }
}

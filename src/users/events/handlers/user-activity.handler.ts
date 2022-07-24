import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ChangeLog } from 'src/common/types/activity.type';
import { UsersRepository } from 'src/users/users.repository';
import { NotificationEvent, UserActivityEvent } from '../impl';
import { v4 as uuidv4 } from 'uuid';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { Project } from 'src/project/model/project.model';
import { Retro } from 'src/retro/models/retro.model';
import { Diff } from 'src/common/interfaces';

@EventsHandler(UserActivityEvent)
export class UserActivityEventHandler
  implements IEventHandler<UserActivityEvent>
{
  constructor(private readonly userRepository: UsersRepository) {}

  async handle(event: UserActivityEvent) {
    console.log('ActivityEventHandler');
    const { type, itemType, item, linkPath, actor, changeLog } = event;
    const actorEntity = await this.userRepository.findById(actor);
    if (!actorEntity.activities) {
      actorEntity.activities = [];
    }
    actorEntity.activities.push({
      id: uuidv4(),
      content: this.generateContent(type, changeLog, itemType, item),
      linkPath,
      timestamp: new Date(),
      type,
      stakeholders: [],
    });
    await this.userRepository.update(actorEntity);
  }

  generateContent(
    type: string,
    changeLog: Diff<Card | Circle | Project | Retro>,
    itemType: string,
    item: Card | Circle | Project | Retro,
  ): string {
    switch (itemType) {
      case 'card':
        return this.generateCardContent(
          type,
          changeLog as Diff<Card>,
          item as Card,
        );
      case 'circle':
        return this.generateCircleContent(
          type,
          changeLog as Diff<Circle>,
          item as Circle,
        );
      case 'project':
        return this.generateProjectContent(
          type,
          changeLog as Diff<Project>,
          item as Project,
        );
      case 'retro':
        return this.generateRetroContent(type, changeLog, item as Retro);
      default:
        return '';
    }
  }

  generateCardContent(type: string, changeLog: Diff<Card>, card: Card): string {
    switch (type) {
      case 'create':
        return `has added a card`;
        break;
      case 'update':
        return `has updated a card`;
        break;
      case 'delete':
        return `has deleted a card`;
        break;
      default:
        return '';
    }
  }

  generateCircleContent(
    type: string,
    changeLog: Diff<Circle>,
    card: Circle,
  ): string {
    if (type === 'create') {
      return `has added a card`;
    }
  }

  generateProjectContent(
    type: string,
    changeLog: Diff<Project>,
    card: Project,
  ): string {
    if (type === 'create') {
      return `has added a card`;
    }
  }

  generateRetroContent(
    type: string,
    changeLog: Diff<Retro>,
    card: Retro,
  ): string {
    if (type === 'create') {
      return `has added a card`;
    }
  }
}

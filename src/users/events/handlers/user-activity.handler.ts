import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { Diff } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { Project } from 'src/project/model/project.model';
import { Retro } from 'src/retro/models/retro.model';
import { UsersRepository } from 'src/users/users.repository';
import { v4 as uuidv4 } from 'uuid';
import { UserActivityEvent } from '../impl';

@EventsHandler(UserActivityEvent)
export class UserActivityEventHandler
  implements IEventHandler<UserActivityEvent>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UserActivityEventHandler');
  }

  async handle(event: UserActivityEvent) {
    try {
      console.log('ActivityEventHandler');
      const { actionType, itemType, item, linkPath, actor, changeLog } = event;
      const actorEntity = await this.userRepository.findById(actor);
      if (!actorEntity.activities) {
        actorEntity.activities = [];
      }
      actorEntity.activities.push({
        id: uuidv4(),
        content: this.generateContent(actionType, changeLog, itemType, item),
        linkPath,
        timestamp: new Date(),
        actionType,
        stakeholders: [],
        ref: {},
      });

      // Note: User activity not supported yet
      //await this.userRepository.update(actorEntity);
    } catch (error) {
      this.logger.error(error);
    }
  }

  generateContent(
    actionType: string,
    changeLog: Diff<Card | Circle | Project | Retro>,
    itemType: string,
    item: Card | Circle | Project | Retro,
  ): string {
    switch (itemType) {
      case 'card':
        return this.generateCardContent(
          actionType,
          changeLog as Diff<Card>,
          item as Card,
        );
      case 'circle':
        return this.generateCircleContent(
          actionType,
          changeLog as Diff<Circle>,
          item as Circle,
        );
      case 'project':
        return this.generateProjectContent(
          actionType,
          changeLog as Diff<Project>,
          item as Project,
        );
      case 'retro':
        return this.generateRetroContent(actionType, changeLog, item as Retro);
      default:
        return '';
    }
  }

  generateCardContent(
    actionType: string,
    changeLog: Diff<Card>,
    card: Card,
  ): string {
    switch (actionType) {
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
    actionType: string,
    changeLog: Diff<Circle>,
    circle: Circle,
  ): string {
    if (actionType === 'create') {
      return `has added a card`;
    }
  }

  generateProjectContent(
    actionType: string,
    changeLog: Diff<Project>,
    project: Project,
  ): string {
    if (actionType === 'create') {
      return `has added a card`;
    }
  }

  generateRetroContent(
    actionType: string,
    changeLog: Diff<Retro>,
    retro: Retro,
  ): string {
    if (actionType === 'create') {
      return `has added a card`;
    }
  }
}

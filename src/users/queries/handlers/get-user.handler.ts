import { HttpException, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { GetMultipleCardsByIdsQuery } from 'src/card/queries/impl';
import { MappedCard } from 'src/card/types/types';
import { CommonTools } from 'src/common/common.service';
import {
  Activity,
  Notification,
  PopulatedUserFields,
  MappedUser,
} from 'src/users/types/types';
import {
  DetailedUserPrivateResponseDto,
  DetailedUserPubliceResponseDto,
} from 'src/users/dto/detailed-user-response.dto';
import { User } from 'src/users/model/users.model';
import { RequestProvider } from 'src/users/user.provider';
import { UsersRepository } from '../../users.repository';
import {
  GetMultipleUsersByIdsQuery,
  GetUserByFilterQuery,
  GetUserByIdQuery,
  GetUserByUsernameQuery,
} from '../impl';
import { GetMultipleCirclesQuery } from 'src/circle/queries/impl';
import { MappedItem } from 'src/common/interfaces';
import { Circle } from 'src/circle/model/circle.model';
import { Card } from 'src/card/model/card.model';
import { GetMultipleRetrosQuery } from 'src/retro/queries/impl';
import { Retro } from 'src/retro/models/retro.model';

@Injectable()
export class UserFieldResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commonTools: CommonTools,
  ) {}

  getContentReferences(
    contentField: Activity[] | Notification[],
    key: 'cards' | 'users' | 'circles' | 'projects' | 'retro',
  ): string[] {
    const ids = [];
    for (const contentObject of contentField) {
      const references = contentObject.ref?.[key];
      if (references) {
        for (const key in references) {
          ids.push(references[key]);
        }
      }
    }

    return ids;
  }

  async getObjectifiedCardDetails(user: User): Promise<MappedItem<Card>> {
    let activityCardIds, notifCardIds: string[];
    if (user.activities) {
      activityCardIds = this.getContentReferences(user.activities, 'cards');
    }

    if (user.notifications) {
      notifCardIds = this.getContentReferences(user.notifications, 'cards');
    }

    const cardIds = [
      ...(user.assignedCards || []),
      ...(user.reviewingCards || []),
      ...(user.reviewingClosedCards || []),
      ...(user.assignedClosedCards || []),
      ...(user.bookmarks || []),
      ...(activityCardIds || []),
      ...(notifCardIds || []),
    ];
    if (user.activeApplications) {
      cardIds.push(...user.activeApplications.map((app) => app.cardId));
    }
    if (user.pickedApplications) {
      cardIds.push(...user.pickedApplications.map((app) => app.cardId));
    }
    if (user.rejectedApplications) {
      cardIds.push(...user.rejectedApplications.map((app) => app.cardId));
    }

    const cards = await this.queryBus.execute(
      new GetMultipleCardsByIdsQuery(
        cardIds,
        {
          project: {
            id: 1,
            name: 1,
            slug: 1,
          },
          assignee: {
            id: 1,
            avatar: 1,
            username: 1,
            ethAddress: 1,
          },
          reviewer: {
            id: 1,
            avatar: 1,
            username: 1,
            ethAddress: 1,
          },
          circle: {
            id: 1,
            name: 1,
            avatar: 1,
            slug: 1,
          },
        },
        {
          id: 1,
          title: 1,
          slug: 1,
          assignee: 1,
          reviewer: 1,
          status: 1,
          priority: 1,
          deadline: 1,
          startDate: 1,
          labels: 1,
        },
      ),
    );

    return this.commonTools.objectify(cards, 'id');
  }

  async getObjectifiedUserDetails(user: User): Promise<MappedItem<User>> {
    let activityUserIds, notifUserIds: string[];
    if (user.activities) {
      activityUserIds = this.getContentReferences(user.activities, 'users');
    }

    if (user.notifications) {
      notifUserIds = this.getContentReferences(user.notifications, 'users');
    }

    const userIds = [...(activityUserIds || []), ...(notifUserIds || [])];
    const users = await this.queryBus.execute(
      new GetMultipleUsersByIdsQuery(
        userIds,
        {},
        {
          id: 1,
          username: 1,
          avatar: 1,
          ethAddress: 1,
        },
      ),
    );
    return this.commonTools.objectify(users, 'id');
  }

  async getObjectifiedCircleDetails(user: User): Promise<MappedItem<Circle>> {
    let activityCircleIds, notifCircleIds: string[];
    if (user.activities) {
      activityCircleIds = this.getContentReferences(user.activities, 'circles');
    }

    if (user.notifications) {
      notifCircleIds = this.getContentReferences(user.notifications, 'circles');
    }

    const circleIds = [
      ...(user.circles || []),
      ...(activityCircleIds || []),
      ...(notifCircleIds || []),
    ];
    const circles = await this.queryBus.execute(
      new GetMultipleCirclesQuery(
        {
          _id: { $in: circleIds },
        },
        {
          parents: {
            name: 1,
            avatar: 1,
            memberRoles: 1,
          },
        },
        {
          id: 1,
          name: 1,
          avatar: 1,
          memberRoles: 1,
          parents: 1,
          slug: 1,
        },
      ),
    );
    return this.commonTools.objectify(circles, 'id');
  }

  async getObjectifiedRetroDetails(user: User): Promise<MappedItem<Retro>> {
    let activityCircleIds, notifCircleIds: string[];
    if (user.activities) {
      activityCircleIds = this.getContentReferences(user.activities, 'retro');
    }

    if (user.notifications) {
      notifCircleIds = this.getContentReferences(user.notifications, 'retro');
    }

    const retroIds = [
      ...(user.retro || []),
      ...(activityCircleIds || []),
      ...(notifCircleIds || []),
    ];
    const retros = await this.queryBus.execute(
      new GetMultipleRetrosQuery(
        {
          _id: { $in: retroIds },
        },
        {
          circle: {
            name: 1,
            avatar: 1,
            memberRoles: 1,
            slug: 1,
          },
        },
        {
          id: 1,
          title: 1,
          slug: 1,
          status: 1,
          parents: 1,
        },
      ),
    );
    return this.commonTools.objectify(retros, 'id');
  }

  populateActor(user: DetailedUserPrivateResponseDto): any {
    if (!user.notifications) return user;
    const updatedNotifs = [];
    for (const notification of user.notifications) {
      notification.content = notification.content?.replace(
        '[actor]',
        user.userDetails[notification.actor]?.username,
      );
      updatedNotifs.push(notification);
    }
    user.notifications = updatedNotifs;
    return user;
  }

  async resolve(
    user: User,
    caller: string,
  ): Promise<DetailedUserPubliceResponseDto | DetailedUserPrivateResponseDto> {
    if (caller === user?.id) {
      const enrichedUser = (await this.resolvePrivateFields(
        user,
      )) as DetailedUserPrivateResponseDto;
      return this.populateActor(enrichedUser);
    } else
      return (await this.resolvePublicFields(
        user,
      )) as DetailedUserPubliceResponseDto;
  }

  async resolvePrivateFields(
    user: User,
  ): Promise<DetailedUserPrivateResponseDto> {
    return {
      ...user,
      cardDetails: {
        ...(await this.getObjectifiedCardDetails(user)),
      },
      userDetails: {
        ...(await this.getObjectifiedUserDetails(user)),
      },
      circleDetails: {
        ...(await this.getObjectifiedCircleDetails(user)),
      },
      retroDetails: { ...(await this.getObjectifiedRetroDetails(user)) },
    };
  }

  async resolvePublicFields(
    user: User,
  ): Promise<DetailedUserPubliceResponseDto> {
    delete user.notifications;
    delete user.bookmarks;
    delete user.githubId;
    delete user.discordId;
    delete user.accounts;
    return {
      ...user,
      cardDetails: {
        ...(await this.getObjectifiedCardDetails(user)),
      },
      userDetails: {
        ...(await this.getObjectifiedUserDetails(user)),
      },
      circleDetails: {
        ...(await this.getObjectifiedCircleDetails(user)),
      },
      retroDetails: { ...(await this.getObjectifiedRetroDetails(user)) },
    };
  }
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler
  implements IQueryHandler<GetUserByIdQuery>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly fieldResolver: UserFieldResolver,
  ) {}

  async execute(
    query: GetUserByIdQuery,
  ): Promise<DetailedUserPubliceResponseDto> {
    const user = await this.userRepository.findById(query.id);
    if (!user) throw new HttpException('User not found', 404);
    return await this.fieldResolver.resolve(user, query.caller);
  }
}

@QueryHandler(GetMultipleUsersByIdsQuery)
export class GetMultipleUsersByIdsQueryHandler
  implements IQueryHandler<GetMultipleUsersByIdsQuery>
{
  constructor(private readonly userRepository: UsersRepository) {}

  async execute(query: GetMultipleUsersByIdsQuery): Promise<User[]> {
    const users = await this.userRepository.getMultipleUsersByIds(
      query.ids,
      query.customPopulate,
      query.selectedFields,
    );
    return users;
  }
}

@QueryHandler(GetUserByUsernameQuery)
export class GetUserByUsernameQueryHandler
  implements IQueryHandler<GetUserByUsernameQuery>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly fieldResolver: UserFieldResolver,
  ) {}

  async execute(
    query: GetUserByUsernameQuery,
  ): Promise<DetailedUserPubliceResponseDto> {
    const user = await this.userRepository.findOne({
      username: query.username,
    });
    if (!user) throw new HttpException('User not found', 404);
    return await this.fieldResolver.resolve(user, query.caller);
  }
}

@QueryHandler(GetUserByFilterQuery)
export class GetUserByFilterQueryHandler
  implements IQueryHandler<GetUserByFilterQuery>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly fieldResolver: UserFieldResolver,
  ) {}

  async execute(
    query: GetUserByFilterQuery,
  ): Promise<DetailedUserPubliceResponseDto> {
    const user = await this.userRepository.findOne(query.filter);
    if (!user) throw new HttpException('User not found', 404);
    return await this.fieldResolver.resolve(user, query.caller);
  }
}

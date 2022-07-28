import { Injectable } from '@nestjs/common';
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
  GetUserByIdQuery,
  GetUserByUsernameQuery,
} from '../impl';

@Injectable()
export class UserFieldResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commonTools: CommonTools,
  ) {}

  getContentReferences(
    contentField: Activity[] | Notification[],
    key: 'cards' | 'users' | 'circles' | 'projects',
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

  async getObjectifiedCardDetails(user: User): Promise<MappedCard> {
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
            avatar: 1,
            username: 1,
          },
          reviewer: {
            avatar: 1,
            username: 1,
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
        },
      ),
    );

    return this.commonTools.objectify(cards, 'id');
  }

  async getObjectifiedUserDetails(user: User): Promise<MappedUser> {
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
    if (caller === user.id) {
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
      circleDetails: {},
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
    return { ...user, cardDetails: {}, userDetails: {}, circleDetails: {} };
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
    return await this.fieldResolver.resolve(user, query.caller);
  }
}
import { HttpException, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { Circle } from 'src/circle/model/circle.model';
import { GetMultipleCirclesQuery } from 'src/circle/queries/impl';
import { CommonTools } from 'src/common/common.service';
import { MappedItem } from 'src/common/interfaces';
import {
  DetailedUserPrivateResponseDto,
  DetailedUserPubliceResponseDto,
} from 'src/users/dto/detailed-user-response.dto';
import { User } from 'src/users/model/users.model';
import { UsersRepository } from '../../users.repository';
import {
  GetMultipleUsersByFilterQuery,
  GetMultipleUsersByIdsQuery,
  GetUserByFilterQuery,
  GetUserByIdQuery,
  GetUserByUsernameQuery,
} from '../impl';

@Injectable()
export class UserFieldResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commonTools: CommonTools,
  ) {}

  async getObjectifiedUserDetails(user: User): Promise<MappedItem<User>> {
    let activityUserIds, notifUserIds: string[];

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

  async resolve(
    user: User,
    caller: string,
  ): Promise<DetailedUserPubliceResponseDto | DetailedUserPrivateResponseDto> {
    if (caller === user?.id) {
      return (await this.resolvePrivateFields(
        user,
      )) as DetailedUserPrivateResponseDto;
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
      userDetails: {
        ...(await this.getObjectifiedUserDetails(user)),
      },
      circleDetails: {
        ...(await this.getObjectifiedCircleDetails(user)),
      },
    };
  }

  async resolvePublicFields(
    user: User,
  ): Promise<DetailedUserPubliceResponseDto> {
    delete user.notifications;
    delete user.githubId;
    delete user.discordId;
    delete user.accounts;
    delete user.email;
    return {
      ...user,
      userDetails: {
        ...(await this.getObjectifiedUserDetails(user)),
      },
      circleDetails: {
        ...(await this.getObjectifiedCircleDetails(user)),
      },
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
  ): Promise<DetailedUserPubliceResponseDto | User> {
    const user = await this.userRepository.findOne(query.filter);
    if (!user) throw new HttpException('User not found', 404);
    if (query.dontResolve) return user;
    return await this.fieldResolver.resolve(user, query.caller);
  }
}

@QueryHandler(GetMultipleUsersByFilterQuery)
export class GetMultipleUsersByFilterQueryHandler
  implements IQueryHandler<GetMultipleUsersByFilterQuery>
{
  constructor(private readonly userRepository: UsersRepository) {}

  async execute(query: GetMultipleUsersByFilterQuery): Promise<User[]> {
    const users = await this.userRepository.getMultipleUsersByFilter(
      query.filter,
      query.customPopulate,
      query.selectedFields,
    );
    return users;
  }
}

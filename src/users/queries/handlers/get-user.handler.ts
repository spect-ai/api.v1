import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  DetailedUserPrivateResponseDto,
  DetailedUserPubliceResponseDto,
} from 'src/users/dto/detailed-user-response.dto';
import { User } from 'src/users/model/users.model';
import { RequestProvider } from 'src/users/user.provider';
import { UsersRepository } from 'src/users/users.repository';
import { GetUserByIdQuery, GetUserByUsernameQuery } from '../impl';

@Injectable()
export class UserFieldResolver {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly requestProvider: RequestProvider,
  ) {}

  async resolve(
    user: User,
  ): Promise<DetailedUserPubliceResponseDto | DetailedUserPrivateResponseDto> {
    if (this.requestProvider.user.id === user.id) {
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
    return { ...user, cardDetails: {}, userDetails: {}, circleDetails: {} };
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
    return await this.fieldResolver.resolve(user);
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
    return await this.fieldResolver.resolve(user);
  }
}

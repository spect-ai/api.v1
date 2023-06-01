import { HttpException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DetailedUserPubliceResponseDto } from 'src/users/dto/detailed-user-response.dto';
import { User } from 'src/users/model/users.model';
import { UsersRepository } from '../../users.repository';
import {
  GetMultipleUsersByFilterQuery,
  GetMultipleUsersByIdsQuery,
  GetUserByFilterQuery,
} from '../impl';

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

@QueryHandler(GetUserByFilterQuery)
export class GetUserByFilterQueryHandler
  implements IQueryHandler<GetUserByFilterQuery>
{
  constructor(private readonly userRepository: UsersRepository) {}

  async execute(
    query: GetUserByFilterQuery,
  ): Promise<DetailedUserPubliceResponseDto | User> {
    const user = await this.userRepository.findOne(query.filter);
    if (!user) throw new HttpException('User not found', 404);
    return user;
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

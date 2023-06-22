import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import {
  PrivateProfileResponseDto,
  PublicProfileResponseDto,
} from 'src/users/dto/profile-response.dto';
import { UsersRepository } from 'src/users/users.repository';
import { GetProfileQuery } from '../impl/get-profile.query';

const publicProfileFields = {
  _id: 1,
  username: 1,
  bio: 1,
  ethAddress: 1,
  avatar: 1,
  email: 1,
  id: 1,
  discordId: 1,
  githubId: 1,
  discordUsername: 1,
  githubUsername: 1,
  discordAvatar: 1,
  githubAvatar: 1,
};

@QueryHandler(GetProfileQuery)
export class GetProfileQueryHandler implements IQueryHandler<GetProfileQuery> {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('GetProfileQueryQueryHandler');
  }

  async execute(query: GetProfileQuery): Promise<PublicProfileResponseDto> {
    try {
      let user = (await this.userRepository.getUserByFilter(
        query.filterQuery,
        null,
        publicProfileFields,
      )) as PrivateProfileResponseDto;
      if (!user) {
        throw `User with filter ${JSON.stringify(query.filterQuery)} not found`;
      }

      if (query.caller !== user.id && !query.overridePrivacy) {
        user = this.filterPrivateFields(user);
      }
      return user;
    } catch (error) {
      this.logger.error(
        `Failed getting user with error: ${JSON.stringify(error)}`,
      );
      throw new InternalServerErrorException(
        `Failed getting user`,
        JSON.stringify(error),
      );
    }
  }

  filterPrivateFields(
    user: PrivateProfileResponseDto,
  ): PublicProfileResponseDto {
    delete user.email;
    delete user.discordId;
    delete user.apiKeys;
    return user;
  }
}

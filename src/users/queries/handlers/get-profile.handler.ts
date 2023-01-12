import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';
import {
  PrivateProfileResponseDto,
  PublicProfileResponseDto,
} from 'src/users/dto/profile-response.dto';
import { LensService } from 'src/users/external/lens.service';
import { UsersRepository } from 'src/users/users.repository';
import { GetProfileQuery } from '../impl/get-profile.query';

const publicProfileFields = {
  _id: 1,
  username: 1,
  bio: 1,
  skillsV2: 1,
  experiences: 1,
  experienceOrder: 1,
  education: 1,
  educationOrder: 1,
  ethAddress: 1,
  lensHandle: 1,
  avatar: 1,
  email: 1,
  id: 1,
  discordId: 1,
};

@QueryHandler(GetProfileQuery)
export class GetProfileQueryHandler implements IQueryHandler<GetProfileQuery> {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly lensService: LensService,
    private readonly logger: LoggingService,
    private readonly commonTools: CommonTools,
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
      console.log({ query: query.filterQuery, user });
      if (!user) {
        throw `User with filter ${query.filterQuery} not found`;
      }

      if (query.caller !== user.id) {
        user = this.filterPrivateFields(user);
      }
      if (!user.lensHandle) {
        return user;
      }
      const lensProfile = await this.lensService.getLensProfile(
        user.lensHandle,
      );
      const localAttributes = {
        skills: [],
        education: [],
        experience: [],
      };
      for (const attribute of lensProfile.attributes) {
        if (attribute.key in localAttributes) {
          localAttributes[attribute.key] = JSON.parse(attribute.value);
        }
        if (attribute.key === 'avatar') {
          user.avatar = attribute.value;
        }
      }

      return {
        ...user,
        skillsV2: localAttributes.skills,
        education: localAttributes.education,
        experiences: localAttributes.experience,
        bio: lensProfile.bio,
      };
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
    return user;
  }
}

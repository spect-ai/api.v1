import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';
import { PublicProfileResponseDto } from 'src/users/dto/profile-response.dto';
import { LensService } from 'src/users/external/lens.service';
import { UsersRepository } from 'src/users/users.repository';
import { GetProfileByIdQuery } from '../impl/get-profile.query';

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
};

@QueryHandler(GetProfileByIdQuery)
export class GetProfileByIdQueryHandler
  implements IQueryHandler<GetProfileByIdQuery>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly lensService: LensService,
    private readonly logger: LoggingService,
    private readonly commonTools: CommonTools,
  ) {
    this.logger.setContext('GetProfileByIdQueryQueryHandler');
  }

  async execute(query: GetProfileByIdQuery): Promise<PublicProfileResponseDto> {
    try {
      const user = await this.userRepository.getUserByFilter(
        query.filterQuery,
        null,
        publicProfileFields,
      );
      if (!user) {
        throw `User with filter ${query.filterQuery} not found`;
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
        `Failed getting user with error: ${error.message}`,
        query,
      );
      throw new InternalServerErrorException(`Failed getting user`, error);
    }
  }
}

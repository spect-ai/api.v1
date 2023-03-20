import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';
import { PublicProfileResponseDto } from 'src/users/dto/profile-response.dto';
import { LensService } from 'src/users/external/lens.service';
import { UsersRepository } from 'src/users/users.repository';
import { GetMeQuery } from '../impl/get-me.query';

const hideProfileFields = {
  assignedCards: 0,
  reviewingCards: 0,
  reviewingClosedCards: 0,
  assignedClosedCards: 0,
  activities: 0,
  notifications: 0,
  notificationsV2: 0,
  collections: 0,
  collectionsSubmittedTo: 0,
  experiences: 0,
  accounts: 0,
  __v: 0,
  retro: 0,
  circles: 0,
};

@QueryHandler(GetMeQuery)
export class GetMeQueryHandler implements IQueryHandler<GetMeQuery> {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly lensService: LensService,
    private readonly logger: LoggingService,
    private readonly commonTools: CommonTools,
  ) {
    this.logger.setContext('GetMeQueryHandler');
  }

  async execute(query: GetMeQuery): Promise<PublicProfileResponseDto> {
    try {
      const { caller } = query;
      const user = await this.userRepository.getUserByFilter(
        { _id: caller },
        null,
        hideProfileFields,
      );

      if (!user) {
        throw `User with id ${caller} not found`;
      }
      if (!user.lensHandle) {
        return user;
      }
      // const lensProfile = await this.lensService.getLensProfile(
      //   user.lensHandle,
      // );
      // const localAttributes = {
      //   skills: [],
      //   education: [],
      //   experience: [],
      // };
      // for (const attribute of lensProfile.attributes) {
      //   if (attribute.key in localAttributes) {
      //     localAttributes[attribute.key] = JSON.parse(attribute.value);
      //   }
      //   if (attribute.key === 'avatar') {
      //     console.log({ attribute });
      //     user.avatar = attribute.value;
      //   }
      // }

      return {
        ...user,
        // skillsV2: localAttributes.skills,
        // education: localAttributes.education,
        // experiences: localAttributes.experience,
        // bio: lensProfile.bio,
      };
    } catch (error) {
      this.logger.error(`Failed getting user me with error: ${error}`);
      throw new InternalServerErrorException(`Failed getting user me`, error);
    }
  }
}

import { InternalServerErrorException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EncryptionService } from 'src/common/encryption.service';
import { LoggingService } from 'src/logging/logging.service';
import { PrivateProfileResponseDto } from 'src/users/dto/profile-response.dto';
import { UsersRepository } from 'src/users/users.repository';
import { GetMeQuery } from '../impl/get-me.query';

const hideProfileFields = {
  notificationsV2: 0,
  collections: 0,
  collectionsSubmittedTo: 0,
  experiences: 0,
  accounts: 0,
  __v: 0,
  circles: 0,
};

@QueryHandler(GetMeQuery)
export class GetMeQueryHandler implements IQueryHandler<GetMeQuery> {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
    private readonly encryptionService: EncryptionService,
  ) {
    this.logger.setContext('GetMeQueryHandler');
  }

  async execute(query: GetMeQuery): Promise<PrivateProfileResponseDto> {
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

      const decryptedApiKeys = user.apiKeys
        ? user.apiKeys.map((apiKey) => this.encryptionService.decrypt(apiKey))
        : [];

      return {
        ...user,
        apiKeys: decryptedApiKeys,
      };
    } catch (error) {
      this.logger.error(`Failed getting user me with error: ${error}`);
      throw new InternalServerErrorException(`Failed getting user me`, error);
    }
  }
}

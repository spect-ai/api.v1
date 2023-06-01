import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { randomBytes } from 'crypto';
import { EthAddressRepository } from 'src/_eth-address/_eth_address.repository';
import { EncryptionService } from 'src/common/encryption.service';
import { LoggingService } from 'src/logging/logging.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserCreatedEvent } from './events/impl';
import { KeysRepository } from './keys.repository';
import { User } from './model/users.model';
import { RequestProvider } from './user.provider';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly ethAddressRepository: EthAddressRepository,
    private readonly usersRepository: UsersRepository,
    private readonly requestProvider: RequestProvider,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly keysRepository: KeysRepository,
    private readonly encryptionService: EncryptionService,
  ) {
    logger.setContext('UsersService');
  }

  async create(ethAddress: string) {
    try {
      const numUsers = await this.usersRepository.count();
      const user = await this.usersRepository.create({
        username: `fren${numUsers + 200}`,
        ethAddress: ethAddress,
      });
      await this.ethAddressRepository.create({
        ethAddress: ethAddress,
        user: user._id,
      });

      this.eventBus.publish(new UserCreatedEvent(user));
      return user;
    } catch (error) {
      this.logger.logError(
        `Failed user creation with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        `Failed user creation`,
        error.message,
      );
    }
  }

  async update(updateUserDto: UpdateUserDto): Promise<User> {
    try {
      if (
        updateUserDto.username &&
        this.requestProvider.user.username !== updateUserDto.username
      ) {
        const usernameTaken = await this.usersRepository.exists({
          username: updateUserDto.username,
        });
        if (usernameTaken) throw new Error('Username taken');
      }
      return await this.usersRepository.updateById(
        this.requestProvider.user.id,
        updateUserDto,
      );
    } catch (error) {
      this.logger.logError(
        `Failed user update with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        'Failed user update',
        error.message,
      );
    }
  }

  async createAPIKey(): Promise<string[]> {
    try {
      const apiKey = randomBytes(32).toString('hex');
      const encryptedApiKey = await this.encryptionService.encrypt(apiKey);
      const user = await this.usersRepository.updateById(
        this.requestProvider.user.id,
        {
          apiKeys: [
            ...(this.requestProvider.user.apiKeys || []),
            encryptedApiKey,
          ],
        },
      );

      await this.keysRepository.create({
        type: 'api-key',
        key: encryptedApiKey,
        userId: user._id.toString(),
      });

      const decryptedApiKeys = user.apiKeys.map((apiKey) =>
        this.encryptionService.decrypt(apiKey),
      );
      return decryptedApiKeys;
    } catch (error) {
      this.logger.logError(
        `Failed creating api key with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        `Failed creating api key`,
        error.message,
      );
    }
  }

  async deleteApiKey(key: string): Promise<string[]> {
    try {
      const user = this.requestProvider.user;
      const encryptedKey = this.encryptionService.encrypt(key);
      const apiKeys = user.apiKeys.filter((apiKey) => apiKey !== encryptedKey);
      const res = await this.usersRepository.updateById(user.id, { apiKeys });
      await this.keysRepository.deleteOne({ key: encryptedKey });

      const decryptedApiKeys = res.apiKeys.map((apiKey) =>
        this.encryptionService.decrypt(apiKey),
      );
      return decryptedApiKeys;
    } catch (error) {
      this.logger.logError(
        `Failed deleting api key with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        `Failed deleting api key`,
        error.message,
      );
    }
  }
}

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EthAddressRepository } from 'src/_eth-address/_eth_address.repository';
import {
  DetailedUserPrivateResponseDto,
  DetailedUserPubliceResponseDto,
} from './dto/detailed-user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './model/users.model';
import { RequestProvider } from './user.provider';
import { UsersRepository } from './users.repository';
import { CommandBus, QueryBus, EventBus } from '@nestjs/cqrs';
import {
  GetUserByFilterQuery,
  GetUserByIdQuery,
  GetUserByUsernameQuery,
} from './queries/impl';
import { LoggingService } from 'src/logging/logging.service';
import { AddItemsCommand, RemoveItemsCommand } from './commands/impl';
import { UserCreatedEvent } from './events/impl';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { EthAddressService } from 'src/_eth-address/_eth-address.service';
import { randomBytes } from 'crypto';
import { KeysRepository } from './keys.repository';
import { EncryptionService } from 'src/common/encryption.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly ethAddressRepository: EthAddressRepository,
    private readonly ethAddressService: EthAddressService,
    private readonly usersRepository: UsersRepository,
    private readonly requestProvider: RequestProvider,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly keysRepository: KeysRepository,
    private readonly encryptionService: EncryptionService,
  ) {
    logger.setContext('UsersService');
  }

  async getUserById(
    id: string,
  ): Promise<DetailedUserPubliceResponseDto | DetailedUserPrivateResponseDto> {
    try {
      return this.queryBus.execute(
        new GetUserByIdQuery(id, this.requestProvider.user?.id),
      );
    } catch (error) {
      this.logger.logError(
        `Failed getting user by id with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        `Failed getting user by id`,
        error.message,
      );
    }
  }

  async getUserByUsername(
    username: string,
  ): Promise<DetailedUserPubliceResponseDto | DetailedUserPrivateResponseDto> {
    try {
      return this.queryBus.execute(
        new GetUserByUsernameQuery(username, this.requestProvider.user?.id),
      );
    } catch (error) {
      this.logger.logError(
        `Failed getting user by username with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        `Failed getting user by username`,
        error.message,
      );
    }
  }

  async getUserByEthAddress(
    ethAddress: string,
  ): Promise<DetailedUserPubliceResponseDto | DetailedUserPrivateResponseDto> {
    try {
      return this.queryBus.execute(
        new GetUserByFilterQuery(
          {
            ethAddress: ethAddress.toLowerCase(),
          },
          this.requestProvider.user?.id,
        ),
      );
    } catch (error) {
      this.logger.logError(
        `Failed getting user by username with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        `Failed getting user by username`,
        error.message,
      );
    }
  }

  async getUserPublicProfile(userId: string): Promise<User> {
    return await this.usersRepository.getUserDetailsByUserId(userId);
  }

  async getPublicProfileOfMultipleUsers(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return [];
    return await this.usersRepository.findAll({
      _id: { $in: userIds },
    });
  }

  async getUserPublicProfileByUsername(username: string): Promise<User> {
    return await this.usersRepository.getUserDetailsByUsername(username);
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

  async getVerifiedCircles(address: string): Promise<string[]> {
    try {
      console.log({ address });
      const user: any = (
        await this.ethAddressService.findByAddress(address.toLowerCase())
      )?.user;
      if (!user) {
        return [];
      }
      const circles = await Promise.all(
        user.circles.map(async (circleId) => {
          const circle = await this.queryBus.execute(
            new GetCircleByIdQuery(circleId),
          );
          if (circle.verified) return circleId;
        }),
      );
      return circles.filter((circle) => circle !== undefined);
    } catch (error) {
      this.logger.logError(
        `Failed getting user by id with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        `Failed getting user by id`,
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

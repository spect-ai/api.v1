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
import { LensService } from './external/lens.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly ethAddressRepository: EthAddressRepository,
    private readonly usersRepository: UsersRepository,
    private readonly requestProvider: RequestProvider,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService,
    private readonly lensService: LensService,
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
      let lensProfile;
      try {
        lensProfile = await this.lensService.getLensDefaultProfile(ethAddress);
      } catch (error) {
        this.logger.logError(
          `Failed to get lens profile with error: ${error.message}`,
          this.requestProvider,
        );
      }
      const user = await this.usersRepository.create({
        username: `fren${numUsers}`,
        ethAddress: ethAddress,
        lensHandle: lensProfile?.handle,
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

  async addItem(
    itemType: 'bookmarks' | 'followingCircles' | 'followingUsers' | 'followers',
    itemId: string,
    userId?: string,
  ): Promise<DetailedUserPubliceResponseDto> {
    try {
      if (!userId) userId = this.requestProvider.user?.id;
      if (!userId) throw new Error('User id cannot be null');

      return await this.commandBus.execute(
        new AddItemsCommand(
          [
            {
              fieldName: itemType,
              itemIds: [itemId],
            },
          ],
          null,
          userId,
        ),
      );
    } catch (error) {
      this.logger.logError(
        `Failed adding ${itemType} to user with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        `Failed adding ${itemType} to user`,
        error.message,
      );
    }
  }

  async removeItem(
    itemType: 'bookmarks' | 'followingCircles' | 'followingUsers' | 'followers',
    itemId: string,
    userId?: string,
  ): Promise<DetailedUserPubliceResponseDto> {
    try {
      return await this.commandBus.execute(
        new RemoveItemsCommand(
          [
            {
              fieldName: itemType,
              itemIds: [itemId],
            },
          ],
          null,
          userId,
        ),
      );
    } catch (error) {
      this.logger.logError(
        `Failed removing ${itemType} to user with error: ${error.message}`,
        this.requestProvider,
      );
      throw new InternalServerErrorException(
        `Failed removing ${itemType} to user`,
        error.message,
      );
    }
  }
}

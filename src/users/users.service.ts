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
import { QueryBus } from '@nestjs/cqrs';
import { GetUserByIdQuery, GetUserByUsernameQuery } from './queries/impl';
@Injectable()
export class UsersService {
  constructor(
    private readonly ethAddressRepository: EthAddressRepository,
    private readonly usersRepository: UsersRepository,
    private readonly requestProvider: RequestProvider,
    private readonly queryBus: QueryBus,
  ) {}

  async getUserById(
    id: string,
  ): Promise<DetailedUserPubliceResponseDto | DetailedUserPrivateResponseDto> {
    return this.queryBus.execute(new GetUserByIdQuery(id));
  }

  async getUserByUsername(
    username: string,
  ): Promise<DetailedUserPubliceResponseDto | DetailedUserPrivateResponseDto> {
    return this.queryBus.execute(new GetUserByUsernameQuery(username));
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
    const numUsers = await this.usersRepository.count();
    const user = await this.usersRepository.create({
      username: `fren${numUsers}`,
      ethAddress: ethAddress,
    });
    await this.ethAddressRepository.create({
      ethAddress: ethAddress,
      user: user._id,
    });
    return user;
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
      let user = this.requestProvider.user;
      if (userId) user = await this.usersRepository.findById(userId);
      if (user[itemType].includes(itemId))
        throw new Error('Item already added');
      return await this.usersRepository.updateAndReturnWithPopulatedFields(
        userId || this.requestProvider.user.id,
        {
          $push: {
            [itemType]: itemId,
          },
        },
      );
    } catch (error) {
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
      let user = this.requestProvider.user;
      if (userId) user = await this.usersRepository.findById(userId);
      user[itemType] = user[itemType].filter((id) => id.toString() !== itemId);
      return await this.usersRepository.updateAndReturnWithPopulatedFields(
        userId || this.requestProvider.user?.id,
        {
          $set: {
            [itemType]: user[itemType],
          },
        },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed adding ${itemType} to user`,
        error.message,
      );
    }
  }
}

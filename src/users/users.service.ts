import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { EthAddressRepository } from 'src/_eth-address/_eth_address.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './model/users.model';
import { RequestProvider } from './user.provider';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly ethAddressRepository: EthAddressRepository,
    private readonly usersRepository: UsersRepository,
    private readonly requestProvider: RequestProvider,
  ) {}

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

  async update(updateUserDto: UpdateUserDto, user: User): Promise<User> {
    try {
      if (updateUserDto.username && user.username !== updateUserDto.username) {
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

  async getUserPublicProfile(userId: string): Promise<User> {
    // Filter what fields get returned as private data is added to user table
    return await this.usersRepository.findById(userId);
  }

  async getPublicProfileOfMultipleUsers(userIds: string[]): Promise<User[]> {
    // Filter what fields get returned as private data is added to user table
    if (userIds.length === 0) return [];
    return await this.usersRepository.findAll({
      _id: { $in: userIds },
    });
  }

  async getUserPublicProfileByUsername(username: string): Promise<User> {
    // Filter what fields get returned as private data is added to user table
    return await this.usersRepository.findOne({ username });
  }
}

import { Injectable, InternalServerErrorException } from '@nestjs/common';
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

  async create(createUserDto: CreateUserDto) {
    const numUsers = await this.usersRepository.count();
    const user = await this.usersRepository.create({
      ...createUserDto,
      username: createUserDto.username
        ? createUserDto.username
        : `fren${numUsers}`,
    });
    await this.ethAddressRepository.create({
      ethAddress: createUserDto.ethAddress,
      user: user._id,
    });
    return user;
  }

  async update(updateUserDto: UpdateUserDto): Promise<User> {
    try {
      if (updateUserDto.username) {
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

  async getUserPublicProfileByUsername(username: string): Promise<User> {
    // Filter what fields get returned as private data is added to user table
    return await this.usersRepository.findOne({ username });
  }
}

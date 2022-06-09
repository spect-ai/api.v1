import { Injectable } from '@nestjs/common';
import { User } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    {
      name: 'John',
      address: '0x6304CE63F2EBf8C0Cc76b60d34Cc52a84aBB6057',
    },
    {
      name: 'a',
      address: '0xb35662a30222c0a7e55482E4602f2DA749519beB',
    },
  ];

  create(createUserDto: User) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(token: string) {
    return this.users.find(
      (user) => user.address.toLowerCase() === token.toLowerCase(),
    );
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

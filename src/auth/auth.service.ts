import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3Token = require('web3-token');

@Injectable()
export class AuthService {
  constructor(private userService: UsersService) {}

  async ValidateUser(token: string): Promise<any> {
    const { address, body } = await Web3Token.verify(token);
    console.log({ body });
    const user = await this.userService.findOne(address);
    return user;
  }
}

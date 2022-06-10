import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { EthAddressRepository } from 'src/_eth-address/_eth_address.repository';
import { ConnectUserDto } from './dto/connect-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3Token = require('web3-token');

@Injectable()
export class UsersService {
  constructor(
    private readonly ethAddressRepository: EthAddressRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async connect(body: ConnectUserDto) {
    try {
      const { address } = await Web3Token.verify(body.token);
      const exists = await this.ethAddressRepository.exists({
        ethAddress: address,
      });
      if (exists) {
        const user = await this.usersRepository.findOne({
          ethAddress: address,
        });
        return user;
      } else {
        const count = await this.ethAddressRepository.count().exec();
        const username = `fren ${count + 1}`;
        const user = await this.usersRepository.create({
          ethAddress: address,
          username: username,
          accounts: [address],
        });
        await this.ethAddressRepository.create({
          ethAddress: address,
          user: user,
          signature: body.signature,
          data: body.data,
        });
        return user;
      }
    } catch {
      throw new HttpException('Invalid Token', HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  findAll() {
    return `This action returns all users`;
  }

  // findOne(token: string) {
  //   return this.users.find(
  //     (user) => user.address.toLowerCase() === token.toLowerCase(),
  //   );
  // }
}

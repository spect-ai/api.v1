import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { EthAddressService } from 'src/_eth-address/_eth-address.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3Token = require('web3-token');

@Injectable()
export class AuthService {
  constructor(private ethAddressService: EthAddressService) {}

  async ValidateUser(token: string): Promise<any> {
    try {
      const { address } = await Web3Token.verify(token);
      const ethAddress = await this.ethAddressService.findByAddress(address);
      if (!ethAddress) {
        throw new UnauthorizedException();
      }
      return ethAddress.user;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

import { HttpException, Injectable } from '@nestjs/common';
import { generateNonce, SiweMessage } from 'siwe';
import { UsersService } from 'src/users/users.service';
import { EthAddressService } from 'src/_eth-address/_eth-address.service';
import { ConnectUserDto } from './dto/connect-user.dto';
@Injectable()
export class AuthService {
  constructor(
    private ethAddressService: EthAddressService,
    private userService: UsersService,
  ) {}

  async getNonce(req): Promise<string> {
    req.session.nonce = generateNonce();
    await req.session.save();
    return req.session.nonce;
  }

  async connect(
    { message, signature }: ConnectUserDto,
    req: any,
  ): Promise<any> {
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.validate(signature);
    if (fields.nonce !== req.session.nonce) {
      console.log('field nonce', fields.nonce);
      console.log('session nonce', req.session.nonce);
      throw new HttpException({ message: 'Invalid nonce.' }, 422);
    }

    req.session.siwe = fields;
    await req.session.save();
    const _ethAddress = await this.ethAddressService.findByAddress(
      req.session.siwe.address.toLowerCase(),
    );
    if (!_ethAddress) {
      const user = await this.userService.create(
        req.session.siwe.address.toLowerCase(),
      );
      return user;
    }
    return _ethAddress.user;
  }
}

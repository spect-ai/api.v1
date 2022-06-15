import { Injectable } from '@nestjs/common';
import { EthAddressRepository } from './_eth_address.repository';

@Injectable()
export class EthAddressService {
  constructor(private readonly ethAddressRepository: EthAddressRepository) {}

  findByAddress(address: string) {
    const res = this.ethAddressRepository
      .findOne({
        ethAddress: address,
      })
      .populate('user');
    return res;
  }
}

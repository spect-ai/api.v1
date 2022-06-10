import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { BaseRepository } from 'src/base/base.repository';
import { _EthAddress } from './model/_ethAddress.model';

@Injectable()
export class EthAddressRepository extends BaseRepository<_EthAddress> {
  constructor(@InjectModel(_EthAddress) ethAdressModel) {
    super(ethAdressModel);
  }
}

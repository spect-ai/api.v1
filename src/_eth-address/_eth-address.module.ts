import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { UsersModule } from 'src/users/users.module';
import { _EthAddress } from './model/_ethAddress.model';
import { EthAddressService } from './_eth-address.service';
import { EthAddressRepository } from './_eth_address.repository';

@Module({
  imports: [TypegooseModule.forFeature([_EthAddress])],
  providers: [EthAddressService, EthAddressRepository],
  exports: [EthAddressService, EthAddressRepository],
})
export class EthAddressModule {}

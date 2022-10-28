import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { CredentialsController } from './credentials.controller';
import { CredentialsRepository } from './credentials.repository';
import { CredentialsService } from './credentials.service';
import { Credentials } from './model/credentials.model';

@Module({
  imports: [TypegooseModule.forFeature([Credentials]), EthAddressModule],
  controllers: [CredentialsController],
  providers: [CredentialsService, CredentialsRepository],
  exports: [CredentialsService, CredentialsModule],
})
export class CredentialsModule {}

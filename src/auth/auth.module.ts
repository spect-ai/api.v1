import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [EthAddressModule, PassportModule],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}

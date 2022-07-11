import { Module } from '@nestjs/common';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { CircleAuthGuard } from './iron-session.guard';

@Module({
  imports: [EthAddressModule, UsersModule],
  providers: [AuthService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}

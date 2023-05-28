import { Module } from '@nestjs/common';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { RateLimitCacheService } from './rate-limit-cache.service';
import { CircleAuthGuard } from './circle.guard';
import { SessionAuthGuard } from './iron-session.guard';
import { CirclesModule } from 'src/circle/circles.module';
import { CommonModule } from 'src/common/common.module';
import { EncryptionService } from 'src/common/encryption.service';

@Module({
  imports: [EthAddressModule, UsersModule, CirclesModule, CommonModule],
  providers: [
    AuthService,
    RateLimitCacheService,
    SessionAuthGuard,
    CircleAuthGuard,
    EncryptionService,
  ],
  exports: [
    AuthService,
    RateLimitCacheService,
    SessionAuthGuard,
    CircleAuthGuard,
  ],
  controllers: [AuthController],
})
export class AuthModule {}

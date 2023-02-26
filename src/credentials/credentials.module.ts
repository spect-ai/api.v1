import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypegooseModule } from 'nestjs-typegoose';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { AuthTokenRefreshService } from 'src/common/authTokenRefresh.service';
import { CommonTools } from 'src/common/common.service';
import { EncryptionService } from 'src/common/encryption.service';
import { LoggingService } from 'src/logging/logging.service';
import { SecretModule } from 'src/secretRegistry/secret.module';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { CredentialsController } from './credentials.controller';
import { CredentialsRepository } from './credentials.repository';
import { CredentialsService } from './credentials.service';
import { Credentials } from './model/credentials.model';
import { GitcoinPassportService } from './services/gitcoin-passport.service';
import { MazuryService } from './services/mazury.service';
import { MintKudosService } from './services/mintkudos.service';
import { PoapService } from './services/poap.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Credentials]),
    EthAddressModule,
    CqrsModule,
    SecretModule,
  ],
  controllers: [CredentialsController],
  providers: [
    CredentialsService,
    CredentialsRepository,
    MazuryService,
    LoggingService,
    GitcoinPassportService,
    CommonTools,
    MintKudosService,
    PoapService,
    SessionAuthGuard,
    AuthTokenRefreshService,
    EncryptionService,
  ],
  exports: [CredentialsService, CredentialsModule, GitcoinPassportService],
})
export class CredentialsModule {}

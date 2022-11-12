import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypegooseModule } from 'nestjs-typegoose';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { CredentialsController } from './credentials.controller';
import { CredentialsRepository } from './credentials.repository';
import { CredentialsService } from './credentials.service';
import { Credentials } from './model/credentials.model';
import { GitcoinPassportService } from './services/gitcoin-passport.service';
import { MazuryService } from './services/mazury.service';
import { MintKudosService } from './services/mintkudos.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Credentials]),
    EthAddressModule,
    CqrsModule,
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
  ],
  exports: [CredentialsService, CredentialsModule, GitcoinPassportService],
})
export class CredentialsModule {}

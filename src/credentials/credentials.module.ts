import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { LoggingService } from 'src/logging/logging.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { CredentialsController } from './credentials.controller';
import { CredentialsRepository } from './credentials.repository';
import { CredentialsService } from './credentials.service';
import { Credentials } from './model/credentials.model';
import { MazuryService } from './services/mazury.service';

@Module({
  imports: [TypegooseModule.forFeature([Credentials]), EthAddressModule],
  controllers: [CredentialsController],
  providers: [
    CredentialsService,
    CredentialsRepository,
    MazuryService,
    LoggingService,
  ],
  exports: [CredentialsService, CredentialsModule],
})
export class CredentialsModule {}

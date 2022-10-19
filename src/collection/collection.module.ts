import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypegooseModule } from 'nestjs-typegoose';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { CommonTools } from 'src/common/common.service';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { MintKudosService } from 'src/common/mint-kudos.service';
import { LoggingService } from 'src/logging/logging.service';
import { MailModule } from 'src/mail/mail.module';
import { RequestProvider } from 'src/users/user.provider';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { CollectionController } from './collection.controller';
import { CollectionRepository } from './collection.repository';
import { CommandHandlers } from './commands';
import { EventHandlers } from './events';
import { Collection } from './model/collection.model';
import { QueryHandlers } from './queries';
import { ActivityBuilder, ActivityResolver } from './services/activity.service';
import { CrudService } from './services/crud.service';
import { ResponseCredentialingService } from './services/response-credentialing.service';
import { DataValidationService } from './validations/data-validation.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Collection]),
    CqrsModule,
    EthAddressModule,
    MailModule,
  ],
  controllers: [CollectionController],
  providers: [
    ...QueryHandlers,
    ...CommandHandlers,
    ...EventHandlers,
    CollectionRepository,
    CommonTools,
    LoggingService,
    DataValidationService,
    ActivityBuilder,
    CrudService,
    ActivityResolver,
    SessionAuthGuard,
    RequestProvider,
    GuildxyzService,
    MintKudosService,
    ResponseCredentialingService,
  ],
  exports: [CollectionModule, CollectionRepository],
})
export class CollectionModule {}

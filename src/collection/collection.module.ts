import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypegooseModule } from 'nestjs-typegoose';
import { CircleAuthGuard } from 'src/auth/circle.guard';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { CirclesModule } from 'src/circle/circles.module';
import { CommonTools } from 'src/common/common.service';
import { DiscordService } from 'src/common/discord.service';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { MintKudosService } from 'src/common/mint-kudos.service';
import { CredentialsModule } from 'src/credentials/credentials.module';
import { CredentialsService } from 'src/credentials/credentials.service';
import { LoggingService } from 'src/logging/logging.service';
import { MailModule } from 'src/mail/mail.module';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { RolesService } from 'src/roles/roles.service';
import { RequestProvider } from 'src/users/user.provider';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { CollectionController } from './collection.controller';
import { CollectionRepository } from './collection.repository';
import { CommandHandlers } from './commands';
import { EventHandlers } from './events';
import { Collection } from './model/collection.model';
import { QueryHandlers } from './queries';
import { ActivityBuilder, ActivityResolver } from './services/activity.service';
import { AdvancedAccessService } from './services/advanced-access.service';
import { ResponseCredentialingService } from './services/response-credentialing.service';
import { DataValidationService } from './validations/data-validation.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Collection]),
    CqrsModule,
    EthAddressModule,
    MailModule,
    CirclesModule,
    RealtimeModule,
    CredentialsModule,
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
    AdvancedAccessService,
    ActivityResolver,
    SessionAuthGuard,
    RequestProvider,
    GuildxyzService,
    MintKudosService,
    ResponseCredentialingService,
    CircleAuthGuard,
    RolesService,
    DiscordService,
  ],
  exports: [CollectionModule, CollectionRepository],
})
export class CollectionModule {}

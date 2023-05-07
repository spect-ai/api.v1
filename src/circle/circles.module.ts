import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CirclesController } from './circles.controller';
import { CirclesService } from './circles.service';
import { Circle } from './model/circle.model';
import { CirclesRepository } from './circles.repository';
import { SlugService } from 'src/common/slug.service';
import { RequestProvider } from 'src/users/user.provider';
import { DiscordService } from 'src/common/discord.service';
import { GithubService } from 'src/common/github.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { RolesService } from 'src/roles/roles.service';
import { CommonTools } from 'src/common/common.service';
import { CircleRegistryService } from './registry.circle.service';
import { RegistryModule } from 'src/registry/registry.module';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { CircleAuthGuard } from 'src/auth/circle.guard';
import { QueryHandlers } from './queries/handlers';
import { CircleV1Controller } from './circles-v1.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { CommandHandlers } from './commands/handlers';
import { EventHandlers } from './events/handlers';
import { CircleValidationService } from './circle-validation.service';
import { CircleMembershipService } from './services/circles-membership.service';
import { CirclesCrudService } from './services/circles-crud.service';
import { CirclesRolesService } from './services/circle-roles.service';
import { CirclePrivateController } from './circles-private.controller';
import { CirclesPrivateRepository } from './circles-private.repository';
import { CirclePrivate } from './model/circle-private.model';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { CircleExternalController } from './circle-external.controller';
import { MintKudosService } from 'src/credentials/services/mintkudos.service';
import { CirclesCollectionService } from './services/circle-collection.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { EncryptionService } from 'src/common/encryption.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Circle]),
    TypegooseModule.forFeature([CirclePrivate]),
    EthAddressModule,
    RegistryModule,
    CqrsModule,
  ],
  controllers: [
    CirclesController,
    CircleV1Controller,
    CirclePrivateController,
    CircleExternalController,
  ],
  providers: [
    CirclesService,
    CirclesRepository,
    SlugService,
    RequestProvider,
    DiscordService,
    GuildxyzService,
    GithubService,
    RolesService,
    CommonTools,
    CircleRegistryService,
    SessionAuthGuard,
    CircleAuthGuard,
    ...QueryHandlers,
    ...CommandHandlers,
    ...EventHandlers,
    LoggingService,
    CircleValidationService,
    CircleMembershipService,
    CirclesCrudService,
    CirclesRolesService,
    CirclesPrivateRepository,
    MintKudosService,
    CirclesCollectionService,
    RealtimeGateway,
    EncryptionService,
  ],
  exports: [
    CirclesService,
    CirclesRepository,
    CirclesModule,
    CirclesPrivateRepository,
  ],
})
export class CirclesModule {}

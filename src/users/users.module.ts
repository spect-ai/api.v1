import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypegooseModule } from 'nestjs-typegoose';
import { EventHandlers } from './events/handlers';
import { CommonTools } from 'src/common/common.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { User } from './model/users.model';
import { RequestProvider } from './user.provider';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { QueryHandlers } from './queries/handlers';
import { CommandHandlers } from './commands/handlers';
import { LoggingService } from 'src/logging/logging.service';
import { MailService } from 'src/mail/mail.service';
import { UsersControllerV1 } from './users-v1.controller';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { PoapService } from 'src/credentials/services/poap.service';
import { MintKudosService } from 'src/credentials/services/mintkudos.service';
import { AuthTokenRefreshService } from 'src/common/authTokenRefresh.service';
import { EncryptionService } from 'src/common/encryption.service';
import { SecretModule } from 'src/secretRegistry/secret.module';
import { CirclesCollectionService } from 'src/circle/services/circle-collection.service';
import { CirclesModule } from 'src/circle/circles.module';
import { KeysRepository } from './keys.repository';
import { Keys } from './model/keys.model';
import { AuthModule } from 'src/auth/auth.module';
import { EmailGeneratorService } from 'src/notification/email-generatr.service';
import { ERC721Service } from 'src/credentials/services/erc721.service';
import { ERC20Service } from 'src/credentials/services/erc20.service';
import { RegistryModule } from 'src/registry/registry.module';
import { ENSService } from 'src/credentials/services/ens.service';
import { GuildxyzService } from 'src/common/guildxyz.service';

@Module({
  imports: [
    TypegooseModule.forFeature([User]),
    TypegooseModule.forFeature([Keys]),
    EthAddressModule,
    CqrsModule,
    SecretModule,
    CirclesModule,
    forwardRef(() => AuthModule),
    RegistryModule,
  ],
  controllers: [UsersControllerV1],
  providers: [
    UsersService,
    UsersRepository,
    RequestProvider,
    CommonTools,
    ...EventHandlers,
    ...QueryHandlers,
    ...CommandHandlers,
    LoggingService,
    MailService,
    PoapService,
    MintKudosService,
    AuthTokenRefreshService,
    EncryptionService,
    CirclesCollectionService,
    RealtimeGateway,
    KeysRepository,
    EmailGeneratorService,
    ERC20Service,
    ERC721Service,
    ENSService,
    GuildxyzService,
  ],
  exports: [UsersService, UsersRepository, UsersModule, KeysRepository],
})
export class UsersModule {}

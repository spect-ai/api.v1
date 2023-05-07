import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CirclesModule } from './circle/circles.module';
import { UsersModule } from './users/users.module';
import { EthAddressModule } from './_eth-address/_eth-address.module';
import { CommonModule } from './common/common.module';
import { RegistryService } from './registry/registry.service';
import { RegistryModule } from './registry/registry.module';
import { RequestProvider } from './users/user.provider';
import { IntegrationsModule } from './integrations/integrations.module';
import { RolesService } from './roles/roles.service';
import { RegistryController } from './registry/registry.controller';
import { CircleRegistryService } from './circle/registry.circle.service';
import { SessionAuthGuard } from './auth/iron-session.guard';
import { CircleAuthGuard } from './auth/circle.guard';
import { CqrsModule } from '@nestjs/cqrs';
import { LoggingService } from './logging/logging.service';
import { ConfigModule } from '@nestjs/config';
import { ContractListener } from './common/contract-listener.service';
import { CollectionController } from './collection/collection.controller';
import { CollectionModule } from './collection/collection.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ActivityResolver as CollectionDataActivityResolver } from './collection/services/activity.service';
import {
  ClaimEligibilityService,
  ResponseCredentialingService,
} from './collection/services/response-credentialing.service';
import { MailModule } from './mail/mail.module';
import { CredentialsModule } from './credentials/credentials.module';
import { AdvancedAccessService } from './collection/services/advanced-access.service';
import { MintKudosService } from './credentials/services/mintkudos.service';
import { NotificationModule } from './notification/notification.module';
import { WhitelistService } from './collection/services/whitelist.service';
import { SurveyProtocolListener } from './common/survey-protocol-listener.service';
import { VRFConsumerListener } from './common/vrf-listener.service';
import { EmailGeneratorService } from './notification/email-generatr.service';
import { MailService } from './mail/mail.service';
import { PoapService } from './credentials/services/poap.service';
import { AuthTokenRefreshService } from './common/authTokenRefresh.service';
import { EncryptionService } from './common/encryption.service';
import { SecretModule } from './secretRegistry/secret.module';
import { GasPredictionService } from './common/gas-prediction.service';
import { AdvancedConditionService } from './collection/services/advanced-condition.service';
import { AutomationModule } from './automation/automation.module';
import { LinkDiscordService } from './collection/services/link-discord.service';
import { LookupModule } from './lookup/lookup.module';
import { SurveyTokenService } from './credentials/services/survey-token.service';

import * as dotenv from 'dotenv';
import { GetCollectionService } from './collection/services/get-collection.service';
import { ZealyService } from './credentials/services/zealy.service';
dotenv.config();

const databaseUrl = process.env.MONGO_URL
  ? `${process.env.MONGO_URL}/nest?authSource=admin&retryWrites=true&w=majority`
  : 'mongodb://localhost:27017/nest';
@Module({
  imports: [
    TypegooseModule.forRoot(databaseUrl),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CirclesModule,
    UsersModule,
    AuthModule,
    EthAddressModule,
    CommonModule,
    RegistryModule,
    IntegrationsModule,
    RegistryModule,
    CqrsModule,
    CollectionModule,
    RealtimeModule,
    MailModule,
    CredentialsModule,
    NotificationModule,
    SecretModule,
    AutomationModule,
    LookupModule,
  ],
  controllers: [AppController, RegistryController, CollectionController],
  providers: [
    AppService,
    RegistryService,
    RequestProvider,
    RolesService,
    RegistryService,
    CircleRegistryService,
    SessionAuthGuard,
    CircleAuthGuard,
    LoggingService,
    ContractListener,
    AdvancedAccessService,
    CollectionDataActivityResolver,
    MintKudosService,
    ResponseCredentialingService,
    WhitelistService,
    SurveyProtocolListener,
    VRFConsumerListener,
    EmailGeneratorService,
    MailService,
    PoapService,
    AuthTokenRefreshService,
    EncryptionService,
    GasPredictionService,
    ClaimEligibilityService,
    AdvancedConditionService,
    LinkDiscordService,
    SurveyTokenService,
    GetCollectionService,
    ZealyService,
  ],
})
export class AppModule {}

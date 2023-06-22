import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypegooseModule } from 'nestjs-typegoose';
import { CirclesModule } from 'src/circle/circles.module';
import { CommonTools } from 'src/common/common.service';
import { DiscordService } from 'src/common/discord.service';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { CredentialsModule } from 'src/credentials/credentials.module';
import { MintKudosService } from 'src/credentials/services/mintkudos.service';
import { LoggingService } from 'src/logging/logging.service';
import { MailModule } from 'src/mail/mail.module';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { RolesService } from 'src/roles/roles.service';
import { RequestProvider } from 'src/users/user.provider';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { CollectionController } from './collection.controller';
import { CollectionRepository } from './collection.repository';
import { CommandHandlers } from './commands';
import { ActivityOnAddData } from './commands/data/handlers/add-data.handler';
import { ActivityOnVoting } from './commands/data/handlers/vote-data.handler';
import { EventHandlers } from './events';
import { Collection } from './model/collection.model';
import { QueryHandlers } from './queries';
import { ActivityBuilder, ActivityResolver } from './services/activity.service';
import { AdvancedAccessService } from './services/advanced-access.service';
import {
  ClaimEligibilityService,
  ResponseCredentialingService,
  ResponseCredentialService,
} from './services/response-credentialing.service';
import { DataValidationService } from './validations/data-validation.service';
import { RegistryService } from 'src/registry/registry.service';
import { RegistryModule } from 'src/registry/registry.module';
import { WhitelistService } from './services/whitelist.service';
import { PoapService } from 'src/credentials/services/poap.service';
import { UpdateValidationService } from './commands/handlers/update-collection.handler';
import { AuthTokenRefreshService } from 'src/common/authTokenRefresh.service';
import { EncryptionService } from 'src/common/encryption.service';
import { SecretModule } from 'src/secretRegistry/secret.module';
import { GasPredictionService } from 'src/common/gas-prediction.service';
import { AdvancedConditionService } from './services/advanced-condition.service';
import { LinkDiscordService } from './services/link-discord.service';
import { LookupModule } from 'src/lookup/lookup.module';
import { SurveyTokenService } from 'src/credentials/services/survey-token.service';
import { CirclesCollectionService } from 'src/circle/services/circle-collection.service';
import { GetCollectionService } from './services/get-collection.service';
import { ZealyService } from 'src/credentials/services/zealy.service';
import { forwardRef } from 'react';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { CollectionV2Controller } from './collection-v2.controller';
import { CollectionV2ProjectController } from './collection-v2-project.controller';
import { CollectionV2FormController } from './collection-v2-form.controller';
import { CollectionV2WebhookController } from './collection-v2-webhook.controller';
import { ProjectDataValidationV2Service } from './services/v2/data-validation-v2.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Collection]),
    CqrsModule,
    EthAddressModule,
    MailModule,
    CirclesModule,
    RealtimeModule,
    CredentialsModule,
    RegistryModule,
    SecretModule,
    LookupModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [
    CollectionController,
    CollectionV2Controller,
    CollectionV2ProjectController,
    CollectionV2FormController,
    CollectionV2WebhookController,
  ],
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
    RequestProvider,
    GuildxyzService,
    MintKudosService,
    ResponseCredentialingService,
    RolesService,
    ActivityOnAddData,
    DiscordService,
    ActivityOnVoting,
    RegistryService,
    ResponseCredentialService,
    WhitelistService,
    PoapService,
    UpdateValidationService,
    AuthTokenRefreshService,
    EncryptionService,
    GasPredictionService,
    ClaimEligibilityService,
    AdvancedConditionService,
    CirclesCollectionService,
    LinkDiscordService,
    SurveyTokenService,
    GetCollectionService,
    ZealyService,
    ProjectDataValidationV2Service,
  ],
  exports: [CollectionModule, CollectionRepository],
})
export class CollectionModule {}

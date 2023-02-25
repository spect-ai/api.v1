import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CirclesModule } from './circle/circles.module';
import { UsersModule } from './users/users.module';
import { EthAddressModule } from './_eth-address/_eth-address.module';
import { CommonModule } from './common/common.module';
import { ProjectService } from './project/project.service';
import { ProjectController } from './project/project.controller';
import { ProjectModule } from './project/project.module';
import { TemplatesService } from './template/templates.service';
import { TemplatesModule } from './template/templates.module';
import { RetroService } from './retro/retro.service';
import { RetroModule } from './retro/retro.module';
import { RegistryService } from './registry/registry.service';
import { RegistryModule } from './registry/registry.module';
import { CardsController } from './card/cards.controller';
import { CardsService } from './card/cards.service';
import { CardsModule } from './card/cards.module';
import { RequestProvider } from './users/user.provider';
import { IntegrationsModule } from './integrations/integrations.module';
import { TemplatesController } from './template/templates.controller';
import { RolesService } from './roles/roles.service';
import { RegistryController } from './registry/registry.controller';
import { ActionService } from './card/actions.service';
import { ActivityBuilder } from './card/activity.builder';
import { ApplicationService } from './card/application.cards.service';
import { ActivityResolver } from './card/activity.resolver';
import { WorkService } from './card/work.cards.service';
import { CardValidationService } from './card/validation.cards.service';
import { CommonUtility, ResponseBuilder } from './card/response.builder';
import { CommentService } from './card/comments.cards.service';
import { CardsProjectService } from './project/cards.project.service';
import { CardsPaymentService } from './card/payment.cards.service';
import { CircleRegistryService } from './circle/registry.circle.service';
import { AutomationModule } from './automation/automation.module';
import { WorkCommandHandler } from './card/handlers/work.command.handler';
import { SessionAuthGuard } from './auth/iron-session.guard';
import { CircleAuthGuard } from './auth/circle.guard';
import { ProjectAuthGuard } from './auth/project.guard';
import { CqrsModule } from '@nestjs/cqrs';
import { CardNotificationService } from './users/notification/card-notification.service';
import { LoggingService } from './logging/logging.service';
import { ConfigModule } from '@nestjs/config';
import { ContractListener } from './common/contract-listener.service';
import { CollectionController } from './collection/collection.controller';
import { CollectionModule } from './collection/collection.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ActivityResolver as CollectionDataActivityResolver } from './collection/services/activity.service';
import { ResponseCredentialingService } from './collection/services/response-credentialing.service';
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
    ProjectModule,
    TemplatesModule,
    RetroModule,
    RegistryModule,
    CardsModule,
    IntegrationsModule,
    RegistryModule,
    AutomationModule,
    CqrsModule,
    CollectionModule,
    RealtimeModule,
    MailModule,
    CredentialsModule,
    NotificationModule,
    SecretModule,
  ],
  controllers: [
    AppController,
    ProjectController,
    CardsController,
    TemplatesController,
    RegistryController,
    CollectionController,
  ],
  providers: [
    AppService,
    ProjectService,
    CardsProjectService,
    TemplatesService,
    RetroService,
    RegistryService,
    CardsService,
    RequestProvider,
    RolesService,
    RegistryService,
    ActionService,
    ActivityBuilder,
    ActivityResolver,
    ApplicationService,
    WorkService,
    CardValidationService,
    ResponseBuilder,
    CommentService,
    CardsPaymentService,
    CircleRegistryService,
    WorkCommandHandler,
    CommonUtility,
    SessionAuthGuard,
    CircleAuthGuard,
    ProjectAuthGuard,
    CardNotificationService,
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
  ],
})
export class AppModule {}

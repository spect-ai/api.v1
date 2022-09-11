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
import { CardsModule } from './card/cards.module';
import { RequestProvider } from './users/user.provider';
import { IntegrationsModule } from './integrations/integrations.module';
import { TemplatesController } from './template/templates.controller';
import { RolesService } from './roles/roles.service';
import { RegistryController } from './registry/registry.controller';
import { ActionService } from './card/actions.service';
import { ApplicationService } from './card/application.cards.service';
import { WorkService } from './card/work.cards.service';
import { CardValidationService } from './card/validation.cards.service';
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
import { ActivityBuilder } from './card/services/activity-builder.service';
import { ActivityResolver } from './card/services/activity-resolver.service';
import { ResponseBuilder } from './card/services/response.service';

const databaseUrl =
  process.env.DATABASE_URL || 'mongodb://localhost:27017/nest';

console.log({ databaseUrl });
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
  ],
  controllers: [
    AppController,
    ProjectController,
    CardsController,
    TemplatesController,
    RegistryController,
  ],
  providers: [
    AppService,
    ProjectService,
    CardsProjectService,
    TemplatesService,
    RetroService,
    RegistryService,
    RequestProvider,
    RolesService,
    RegistryService,
    ActionService,
    ApplicationService,
    WorkService,
    CardValidationService,
    CommentService,
    CardsPaymentService,
    CircleRegistryService,
    WorkCommandHandler,
    SessionAuthGuard,
    CircleAuthGuard,
    ProjectAuthGuard,
    CardNotificationService,
    LoggingService,
    ContractListener,
    ActivityBuilder,
    ActivityResolver,
    ResponseBuilder,
  ],
})
export class AppModule {}

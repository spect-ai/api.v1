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
import { ResponseBuilder } from './card/response.builder';
import { CommentService } from './card/comments.cards.service';
import { CardsProjectService } from './project/cards.project.service';
import { CardsPaymentService } from './card/payment.cards.service';
import { CircleRegistryService } from './circle/registry.circle.service';
import { AutomationService } from './automation/automation.service';
import { AutomationModule } from './automation/automation.module';
import { CardCommandHandler } from './card/handlers/update.command.handler';

const databaseUrl =
  process.env.DATABASE_URL || 'mongodb://localhost:27017/nest';

console.log({ databaseUrl });
@Module({
  imports: [
    TypegooseModule.forRoot(databaseUrl),
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
    AutomationService,
    CardCommandHandler,
  ],
})
export class AppModule {}

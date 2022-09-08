import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypegooseModule } from 'nestjs-typegoose';
import { CircleAuthGuard } from 'src/auth/circle.guard';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { ProjectAuthGuard, ViewProjectAuthGuard } from 'src/auth/project.guard';
import { AutomationModule } from 'src/automation/automation.module';
import { AutomationService } from 'src/automation/automation.service';
import { ActivityBuilder } from 'src/card/activity.builder';
import { CirclesModule } from 'src/circle/circles.module';
import { CommonTools } from 'src/common/common.service';
import { DiscordService } from 'src/common/discord.service';
import { SlugService } from 'src/common/slug.service';
import { LoggingService } from 'src/logging/logging.service';
import { CardsProjectService } from 'src/project/cards.project.service';
import { ProjectModule } from 'src/project/project.module';
import { ProjectService } from 'src/project/project.service';
import { RegistryModule } from 'src/registry/registry.module';
import { RegistryService } from 'src/registry/registry.service';
import { RolesService } from 'src/roles/roles.service';
import { TemplatesModule } from 'src/template/templates.module';
import { CardNotificationService } from 'src/users/notification/card-notification.service';
import { RequestProvider } from 'src/users/user.provider';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { ActionService } from './actions.service';
import { ActivityResolver } from './activity.resolver';
import { ApplicationService } from './application.cards.service';
import { CardsV1Controller } from './cards-v1.controller';
import { CardsV1Service } from './cards-v1.service';
import { CardsController } from './cards.controller';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import { CommandHandlers } from './commands/handlers';
import { CommentService } from './comments.cards.service';
import { EventHandlers } from './events/handlers';
import { CardCommandHandler } from './handlers/update.command.handler';
import { WorkCommandHandler } from './handlers/work.command.handler';
import { Card } from './model/card.model';
import { CardsPaymentService } from './payment.cards.service';
import { QueryHandlers } from './queries/handlers';
import { CommonUtility, ResponseBuilder } from './response.builder';
import { CardValidationService } from './validation.cards.service';
import { WorkService } from './work.cards.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Card]),
    forwardRef(() => ProjectModule),
    CirclesModule,
    TemplatesModule,
    EthAddressModule,
    RequestProvider,
    forwardRef(() => UsersModule),
    forwardRef(() => AutomationModule),
    CqrsModule,
    RegistryModule,
  ],
  controllers: [CardsController, CardsV1Controller],
  providers: [
    CardsService,
    CardsRepository,
    SlugService,
    RequestProvider,
    ProjectService,
    CardsProjectService,
    CommonTools,
    ActionService,
    ActivityBuilder,
    ActivityResolver,
    ApplicationService,
    WorkService,
    CardValidationService,
    ResponseBuilder,
    CommentService,
    CardsPaymentService,
    CardCommandHandler,
    AutomationService,
    WorkCommandHandler,
    CommonUtility,
    RolesService,
    DiscordService,
    SessionAuthGuard,
    CircleAuthGuard,
    ProjectAuthGuard,
    UsersService,
    ...EventHandlers,
    ...QueryHandlers,
    ...CommandHandlers,
    CardNotificationService,
    LoggingService,
    CardsV1Service,
    ViewProjectAuthGuard,
    RegistryService,
  ],
  exports: [
    CardsService,
    CardsRepository,
    CardsModule,
    ActionService,
    CardCommandHandler,
  ],
})
export class CardsModule {}

import { forwardRef, Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CirclesModule } from 'src/circle/circles.module';
import { ActivityBuilder } from 'src/card/activity.builder';
import { CommonTools } from 'src/common/common.service';
import { SlugService } from 'src/common/slug.service';
import { ProjectModule } from 'src/project/project.module';
import { ProjectService } from 'src/project/project.service';
import { TemplatesModule } from 'src/template/templates.module';
import { RequestProvider } from 'src/users/user.provider';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { EthAddressService } from 'src/_eth-address/_eth-address.service';
import { ActionService } from './actions.service';
import { CardsController } from './cards.controller';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import { CardsService as CardsServiceV1 } from './services/cards.service';
import { Card } from './model/card.model';
import { ApplicationService } from './application.cards.service';
import { ActivityResolver } from './activity.resolver';
import { ActivityResolver as ActivityResolverV1 } from './services/activity-resolver.service';
import { UsersModule } from 'src/users/users.module';
import { WorkService } from './work.cards.service';
import { CardValidationService } from './validation.cards.service';
import { CommonUtility, ResponseBuilder } from './response.builder';
import { ResponseBuilder as ResponseBuilderV1 } from './services/response.service';
import { CommentService } from './comments.cards.service';
import { CardsProjectService } from 'src/project/cards.project.service';
import { CardsPaymentService } from './payment.cards.service';
import { CardCommandHandler } from './handlers/update.command.handler';
import { AutomationModule } from 'src/automation/automation.module';
import { AutomationService } from 'src/automation/automation.service';
import { WorkCommandHandler } from './handlers/work.command.handler';
import { RolesService } from 'src/roles/roles.service';
import { DiscordService } from 'src/common/discord.service';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { CircleAuthGuard } from 'src/auth/circle.guard';
import { ProjectAuthGuard } from 'src/auth/project.guard';
import { UsersRepository } from 'src/users/users.repository';
import { UsersService } from 'src/users/users.service';
import { CreateCardCommandHandler } from './handlers/create.command.handler';
import { UserCardsService } from './user.cards.service';
import { EventHandlers } from './events/handlers';
import { CardNotificationService } from 'src/users/notification/card-notification.service';
import { CqrsModule } from '@nestjs/cqrs';
import { QueryHandlers } from './queries/handlers';
import { LoggingService } from 'src/logging/logging.service';
import { CardsV1Controller } from './cards-v1.controller';
import { CommandHandlers } from './commands/handlers';
import { CrudOrchestrator } from './orchestrators/crud.orchestrator';
import { CommonUpdateService } from './services/common-update.service';
import { ActivityBuilder as ActivityBuilderV1 } from './services/activity-builder.service';

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
    CreateCardCommandHandler,
    UserCardsService,
    ...EventHandlers,
    ...QueryHandlers,
    ...CommandHandlers,
    CardNotificationService,
    LoggingService,
    CrudOrchestrator,
    CardsServiceV1,
    ResponseBuilderV1,
    ActivityResolverV1,
    ActivityBuilderV1,
    CommonUpdateService,
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

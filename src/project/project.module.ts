import { forwardRef, Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { SlugService } from 'src/common/slug.service';
import { Project } from './model/project.model';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectsRepository } from './project.repository';
import { CirclesModule } from 'src/circle/circles.module';
import { TemplatesModule } from 'src/template/templates.module';
import { CardsModule } from 'src/card/cards.module';
import { CommonTools } from 'src/common/common.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { CardsProjectService } from './cards.project.service';
import { ActionService } from 'src/card/actions.service';
import { RequestProvider } from 'src/users/user.provider';
import { CardValidationService } from 'src/card/validation.cards.service';
import { AutomationModule } from 'src/automation/automation.module';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { CircleAuthGuard } from 'src/auth/circle.guard';
import { RolesService } from 'src/roles/roles.service';
import { DiscordService } from 'src/common/discord.service';
import { LoggingService } from 'src/logging/logging.service';
import { QueryHandlers } from './queries/handlers';

@Module({
  imports: [
    TypegooseModule.forFeature([Project]),
    CirclesModule,
    forwardRef(() => TemplatesModule),
    forwardRef(() => CardsModule),
    forwardRef(() => AutomationModule),
    EthAddressModule,
  ],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    ProjectsRepository,
    SlugService,
    CommonTools,
    CardsProjectService,
    ActionService,
    RequestProvider,
    CardValidationService,
    RolesService,
    DiscordService,
    CircleAuthGuard,
    SessionAuthGuard,
    LoggingService,
    ...QueryHandlers,
  ],
  exports: [ProjectService, ProjectsRepository, ProjectModule],
})
export class ProjectModule {}

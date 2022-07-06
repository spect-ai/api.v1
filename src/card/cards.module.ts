import { forwardRef, Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CirclesModule } from 'src/circle/circles.module';
import { ActivityBuilder } from 'src/card/activity.builder';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
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
import { Card } from './model/card.model';
import { ApplicationService } from './application.cards.service';
import { ActivityResolver } from './activity.resolver';
import { UsersModule } from 'src/users/users.module';
import { WorkService } from './work.cards.service';
import { CardValidationService } from './validation.cards.service';
import { ResponseBuilder } from './response.builder';
import { CommentService } from './comments.cards.service';
import { CardsProjectService } from 'src/project/cards.project.service';
import { CardsPaymentService } from './payment.cards.service';
import { CardCommandHandler } from './command.handler';
import { AutomationModule } from 'src/automation/automation.module';
import { AutomationService } from 'src/automation/automation.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Card]),
    forwardRef(() => ProjectModule),
    CirclesModule,
    TemplatesModule,
    EthAddressModule,
    RequestProvider,
    UsersModule,
    forwardRef(() => AutomationModule),
  ],
  controllers: [CardsController],
  providers: [
    CardsService,
    CardsRepository,
    SlugService,
    RequestProvider,
    ProjectService,
    CardsProjectService,
    DataStructureManipulationService,
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

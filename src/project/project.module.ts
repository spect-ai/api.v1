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
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { CardsProjectService } from './cards.project.service';
import { ActionService } from 'src/card/actions.service';
import { RequestProvider } from 'src/users/user.provider';
import { CardValidationService } from 'src/card/validation.cards.service';
import { AutomationModule } from 'src/automation/automation.module';

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
    DataStructureManipulationService,
    CardsProjectService,
    ActionService,
    RequestProvider,
    CardValidationService,
  ],
  exports: [ProjectService, ProjectsRepository, ProjectModule],
})
export class ProjectModule {}

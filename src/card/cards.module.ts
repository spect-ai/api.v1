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
import { BountyService } from './bounty.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Card]),
    forwardRef(() => ProjectModule),
    CirclesModule,
    TemplatesModule,
    EthAddressModule,
    RequestProvider,
  ],
  controllers: [CardsController],
  providers: [
    CardsService,
    CardsRepository,
    SlugService,
    RequestProvider,
    ProjectService,
    DataStructureManipulationService,
    ActionService,
    ActivityBuilder,
    BountyService,
  ],
  exports: [CardsService, CardsRepository, CardsModule],
})
export class CardsModule {}

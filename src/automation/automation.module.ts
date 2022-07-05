import { Module } from '@nestjs/common';
import { CardsModule } from 'src/card/cards.module';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
import { CardsProjectService } from 'src/project/cards.project.service';
import { ProjectModule } from 'src/project/project.module';
import { RequestProvider } from 'src/users/user.provider';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { EthAddressService } from 'src/_eth-address/_eth-address.service';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';

@Module({
  imports: [ProjectModule, EthAddressModule, RequestProvider, CardsModule],
  controllers: [AutomationController],
  providers: [
    EthAddressService,
    AutomationService,
    CardsProjectService,
    DataStructureManipulationService,
  ],
})
export class AutomationModule {}

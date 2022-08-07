import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CardsModule } from 'src/card/cards.module';
import { CommonTools } from 'src/common/common.service';
import { CardsProjectService } from 'src/project/cards.project.service';
import { ProjectModule } from 'src/project/project.module';
import { RequestProvider } from 'src/users/user.provider';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { EthAddressService } from 'src/_eth-address/_eth-address.service';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { CommandHandlers } from './commands/handlers';
import { QueryHandlers } from './queries/handlers';

@Module({
  imports: [
    EthAddressModule,
    RequestProvider,
    forwardRef(() => CardsModule),
    forwardRef(() => ProjectModule),
    CqrsModule,
  ],
  controllers: [AutomationController],
  providers: [
    EthAddressService,
    AutomationService,
    CardsProjectService,
    CommonTools,
    RequestProvider,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class AutomationModule {}

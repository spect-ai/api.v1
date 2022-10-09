import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypegooseModule } from 'nestjs-typegoose';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { CollectionController } from './collection.controller';
import { CollectionRepository } from './collection.repository';
import { CommandHandlers } from './commands';
import { EventHandlers } from './events';
import { Collection } from './model/collection.model';
import { QueryHandlers } from './queries';
import { ActivityBuilder, ActivityResolver } from './services/activity.service';
import { CrudService } from './services/crud.service';
import { DataValidationService } from './validations/data-validation.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Collection]),
    CqrsModule,
    EthAddressModule,
  ],
  controllers: [CollectionController],
  providers: [
    ...QueryHandlers,
    ...CommandHandlers,
    ...EventHandlers,
    CollectionRepository,
    CommonTools,
    LoggingService,
    DataValidationService,
    ActivityBuilder,
    CrudService,
    ActivityResolver,
  ],
  exports: [CollectionModule],
})
export class CollectionModule {}
